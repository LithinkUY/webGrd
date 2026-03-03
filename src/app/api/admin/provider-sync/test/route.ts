import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// POST: probar conexión SOAP sin importar productos
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ['sync_email', 'sync_token', 'sync_url'] } },
  });
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;

  if (!config.sync_url) {
    return NextResponse.json({ success: false, error: 'URL del web service no configurada' });
  }
  if (!config.sync_email || !config.sync_token) {
    return NextResponse.json({ success: false, error: 'Email y token no configurados' });
  }

  const soapXml = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope
    xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ns1="http://schema.example.com"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
    SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <SOAP-ENV:Body>
        <ns1:productos_con_galeria>
            <email xsi:type="xsd:string">${config.sync_email}</email>
            <token xsi:type="xsd:string">${config.sync_token}</token>
            <fecha xsi:type="xsd:string">2099-01-01 00:00:00</fecha>
            <formato xsi:type="xsd:string">json</formato>
        </ns1:productos_con_galeria>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  try {
    const response = await fetch(config.sync_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '""',
      },
      body: soapXml,
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await response.text();
    const preview = responseText.substring(0, 800);

    // Detectar faultstring
    const faultMatch = responseText.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i);
    if (faultMatch) {
      return NextResponse.json({
        success: false,
        httpStatus: response.status,
        error: `Error SOAP: ${faultMatch[1].trim()}`,
        rawResponse: preview,
      });
    }

    // Detectar respuesta HTML (página de login, redirect, etc.)
    if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
      return NextResponse.json({
        success: false,
        httpStatus: response.status,
        error: 'El servidor devolvió HTML en vez de SOAP. La URL puede ser incorrecta.',
        rawResponse: preview,
      });
    }

    // Detectar <return> con datos
    const returnMatch = responseText.match(/<return[^>]*>([\s\S]*?)<\/return>/i)
      || responseText.match(/<productos_con_galeriaReturn[^>]*>([\s\S]*?)<\/productos_con_galeriaReturn>/i)
      || responseText.match(/<ns\d*:return[^>]*>([\s\S]*?)<\/ns\d*:return>/i);

    if (returnMatch) {
      const content = returnMatch[1].trim();
      // Fecha futura = array vacío es correcto (conexión OK)
      const decoded = content
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
      
      try {
        const parsed = JSON.parse(decoded);
        return NextResponse.json({
          success: true,
          httpStatus: response.status,
          message: `✅ Conexión exitosa. El servidor respondió correctamente (${Array.isArray(parsed) ? parsed.length + ' productos en respuesta' : 'respuesta válida'})`,
          rawResponse: preview,
        });
      } catch {
        return NextResponse.json({
          success: true,
          httpStatus: response.status,
          message: '✅ Conexión establecida. Respuesta SOAP recibida (contenido no-JSON, puede ser normal).',
          rawResponse: preview,
        });
      }
    }

    // Array JSON directo
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return NextResponse.json({
        success: true,
        httpStatus: response.status,
        message: '✅ Conexión exitosa. JSON recibido directamente.',
        rawResponse: preview,
      });
    }

    // Respuesta vacía o desconocida
    return NextResponse.json({
      success: false,
      httpStatus: response.status,
      error: responseText.trim() 
        ? 'Respuesta recibida pero no reconocida como SOAP/JSON válido.' 
        : 'Respuesta vacía del servidor.',
      rawResponse: preview,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({
      success: false,
      error: `Error de red: ${msg}`,
      rawResponse: null,
    });
  }
}

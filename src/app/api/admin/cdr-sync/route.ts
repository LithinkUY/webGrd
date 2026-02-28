import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// GET: obtener la config de CDR Medios
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const settings = await prisma.siteSetting.findMany({
    where: { key: { startsWith: 'cdr_' } },
  });

  const config: Record<string, string> = {};
  for (const s of settings) {
    config[s.key] = s.value;
  }

  // Obtener últimas sincronizaciones
  const logs = await prisma.syncLog.findMany({
    where: { apiSourceId: 'cdr-medios' },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  // Contar productos importados de CDR
  const importedCount = await prisma.product.count({
    where: { sourceApi: 'cdr-medios' },
  });

  return NextResponse.json({ config, logs, importedCount });
}

// PUT: guardar config CDR
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { email, token } = body;

  const updates = [
    { key: 'cdr_email', value: email || '' },
    { key: 'cdr_token', value: token || '' },
  ];

  for (const u of updates) {
    await prisma.siteSetting.upsert({
      where: { key: u.key },
      create: { key: u.key, value: u.value },
      update: { value: u.value },
    });
  }

  return NextResponse.json({ success: true });
}

// POST: ejecutar sincronización
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { fecha } = body; // fecha desde la cual sincronizar

  // Obtener credenciales
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ['cdr_email', 'cdr_token'] } },
  });
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;

  if (!config.cdr_email || !config.cdr_token) {
    return NextResponse.json({ error: 'Configurá email y token de CDR Medios primero' }, { status: 400 });
  }

  // Crear log de sync
  const syncLog = await prisma.syncLog.create({
    data: {
      apiSourceId: 'cdr-medios',
      status: 'running',
      itemsSynced: 0,
      itemsFailed: 0,
    },
  });

  try {
    const syncDate = fecha || '2015-01-01 00:00:00';

    // Construir el envelope SOAP
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
            <email xsi:type="xsd:string">${config.cdr_email}</email>
            <token xsi:type="xsd:string">${config.cdr_token}</token>
            <fecha xsi:type="xsd:string">${syncDate}</fecha>
            <formato xsi:type="xsd:string">json</formato>
        </ns1:productos_con_galeria>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

    const soapUrl = 'https://www.cdrmedios.com/ws/productos/service.php?class=SublimewsProductosUsuariosCompleto';

    const response = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `${soapUrl}&method=productos_con_galeria`,
      },
      body: soapXml,
    });

    if (!response.ok) {
      throw new Error(`SOAP error: HTTP ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();

    // Extraer el JSON del envelope SOAP de respuesta
    // La respuesta SOAP envuelve el resultado en tags XML, necesitamos extraer el JSON
    let productsJson: string;

    // Intentar extraer el contenido de la respuesta SOAP
    const returnMatch = responseText.match(/<return[^>]*>([\s\S]*?)<\/return>/i)
      || responseText.match(/<productos_con_galeriaReturn[^>]*>([\s\S]*?)<\/productos_con_galeriaReturn>/i)
      || responseText.match(/<ns\d*:return[^>]*>([\s\S]*?)<\/ns\d*:return>/i);

    if (returnMatch) {
      productsJson = returnMatch[1];
    } else {
      // Quizá la respuesta ya es JSON puro o tiene otro formato
      // Intentar encontrar el array JSON directamente
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        productsJson = jsonMatch[0];
      } else {
        throw new Error('No se pudo extraer datos de la respuesta SOAP. Verificá email y token.');
      }
    }

    // Decodificar entidades HTML que pueda tener
    productsJson = productsJson
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    let products: any[];
    try {
      products = JSON.parse(productsJson);
    } catch {
      throw new Error('La respuesta del servidor no es JSON válido. Verificá credenciales.');
    }

    if (!Array.isArray(products)) {
      throw new Error('Respuesta inesperada del servidor');
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Obtener o crear categoría por defecto para productos CDR
    let defaultCategory = await prisma.category.findFirst({
      where: { slug: 'cdr-medios' },
    });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: 'CDR Medios',
          slug: 'cdr-medios',
          description: 'Productos importados desde CDR Medios',
          active: true,
        },
      });
    }

    // Obtener o crear marca CDR Medios
    let defaultBrand = await prisma.brand.findFirst({
      where: { slug: 'cdr-medios' },
    });
    if (!defaultBrand) {
      defaultBrand = await prisma.brand.create({
        data: {
          name: 'CDR Medios',
          slug: 'cdr-medios',
          active: true,
        },
      });
    }

    for (const product of products) {
      try {
        const codigo = product.codigo?.trim();
        if (!codigo) {
          failed++;
          errors.push('Producto sin código, saltado');
          continue;
        }

        const nombre = product.nombre?.trim() || `Producto ${codigo}`;
        const precio = parseFloat(product.precio) || 0;
        const stock = parseInt(product.stock) || 0;
        const copete = product.copete?.trim() || '';
        const descripcion = product.descripcion?.trim() || '';
        const gtin = product.gtin?.trim() || null;
        const modelo = product.modelo?.trim() || null;
        const nroParte = product.nro_parte?.trim() || null;

        // Construir array de imágenes desde la galería
        const images: string[] = [];
        if (product.galeria && Array.isArray(product.galeria)) {
          for (const img of product.galeria) {
            if (img.img) images.push(img.img);
          }
        }

        // Generar slug único
        let slug = slugify(nombre, { lower: true, strict: true, locale: 'es' });
        if (!slug || slug.length < 2) slug = `producto-${codigo.toLowerCase()}`;

        // Buscar si ya existe por sourceId + sourceApi
        const existing = await prisma.product.findFirst({
          where: {
            sourceId: codigo,
            sourceApi: 'cdr-medios',
          },
        });

        if (existing) {
          // Actualizar precio, stock e imágenes
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              cost: precio,
              price: precio,
              stock: stock,
              images: JSON.stringify(images),
              description: descripcion || existing.description,
              shortDesc: copete || existing.shortDesc,
              barcode: gtin || existing.barcode,
              updatedAt: new Date(),
            },
          });
        } else {
          // Verificar que el slug no exista
          const slugExists = await prisma.product.findFirst({ where: { slug } });
          if (slugExists) {
            slug = `${slug}-${codigo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          }

          // Verificar que el SKU no exista
          const skuExists = await prisma.product.findFirst({ where: { sku: codigo } });
          if (skuExists) {
            // Actualizar el existente si tiene el mismo SKU
            await prisma.product.update({
              where: { id: skuExists.id },
              data: {
                cost: precio,
                price: precio,
                stock: stock,
                images: JSON.stringify(images),
                description: descripcion || skuExists.description,
                shortDesc: copete || skuExists.shortDesc,
                sourceId: codigo,
                sourceApi: 'cdr-medios',
                barcode: gtin || skuExists.barcode,
              },
            });
          } else {
            await prisma.product.create({
              data: {
                name: nombre,
                slug,
                sku: codigo,
                description: descripcion,
                shortDesc: copete,
                cost: precio,
                price: precio,
                stock: stock,
                images: JSON.stringify(images),
                barcode: gtin,
                categoryId: defaultCategory.id,
                brandId: defaultBrand.id,
                sourceId: codigo,
                sourceApi: 'cdr-medios',
                active: stock > 0,
                specs: nroParte || modelo
                  ? JSON.stringify({ modelo: modelo || '', nro_parte: nroParte || '' })
                  : null,
              },
            });
          }
        }

        synced++;
      } catch (err: any) {
        failed++;
        errors.push(`Error en ${product.codigo || '?'}: ${err.message}`);
      }
    }

    // Actualizar log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: failed === 0 ? 'success' : synced > 0 ? 'partial' : 'error',
        itemsSynced: synced,
        itemsFailed: failed,
        errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
        finishedAt: new Date(),
      },
    });

    // Guardar última fecha de sync
    await prisma.siteSetting.upsert({
      where: { key: 'cdr_last_sync' },
      create: { key: 'cdr_last_sync', value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      totalReceived: products.length,
      synced,
      failed,
      errors: errors.slice(0, 10),
    });

  } catch (error: any) {
    // Actualizar log con error
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'error',
        errors: JSON.stringify([error.message]),
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      error: error.message || 'Error durante la sincronización',
    }, { status: 500 });
  }
}

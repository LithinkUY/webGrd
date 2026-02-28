import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `Eres un asistente de administración de ImpoTech, una tienda de tecnología en Uruguay.
Ayudas al equipo de administración con:
- Gestión de productos, categorías, marcas y precios
- Consultas sobre pedidos y clientes
- Estrategias de precios y márgenes
- Uso del panel de administración
- Análisis de ventas y stock
Responde siempre en español de manera concisa y profesional.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada en .env' }, { status: 500 });
  }

  try {
    const { message, history = [] } = await req.json();

    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Entendido. Soy el asistente de ImpoTech. ¿En qué te puedo ayudar?' }] },
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sin respuesta';
    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

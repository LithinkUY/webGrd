import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SYSTEM_PROMPT = `Eres un asistente de administracion de una tienda de tecnologia en Uruguay.
Ayudas al equipo de administracion con:
- Gestion de productos, categorias, marcas y precios
- Consultas sobre pedidos y clientes
- Estrategias de precios y margenes
- Uso del panel de administracion
- Analisis de ventas y stock
Responde siempre en espanol de manera concisa y profesional.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'store_admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada en Vercel' }, { status: 500 });
  }

  try {
    const { message, history = [] } = await req.json();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h: { role: string; parts: { text: string }[] }) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts?.[0]?.text ?? '',
      })),
      { role: 'user', content: message },
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: 1024 }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Groq error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Sin respuesta';
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

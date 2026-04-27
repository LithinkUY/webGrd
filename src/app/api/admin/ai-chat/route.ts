import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SYSTEM_PROMPT = `Eres un asistente de administración de una tienda de tecnología en Uruguay.
Ayudas al equipo de administración con:
- Gestión de productos, categorías, marcas y precios
- Consultas sobre pedidos y clientes
- Estrategias de precios y márgenes
- Uso del panel de administración
- Análisis de ventas y stock
Responde siempre en español de manera concisa y profesional.`;

// --- Groq (gratis, llama3) ---
async function callGroq(message: string, history: {role:string; parts:{text:string}[]}[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((h) => ({
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
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'Sin respuesta';
}

// --- Gemini (fallback) ---
async function callGemini(message: string, history: {role:string; parts:{text:string}[]}[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Entendido. Soy el asistente. ¿En qué te puedo ayudar?' }] },
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }) }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sin respuesta';
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { message, history = [] } = await req.json();

    // Intenta Groq primero, si falla usa Gemini
    let reply: string;
    let provider = 'groq';
    try {
      reply = await callGroq(message, history);
    } catch {
      provider = 'gemini';
      reply = await callGemini(message, history);
    }

    return NextResponse.json({ reply, provider });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const sources = await prisma.apiSource.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const source = await prisma.apiSource.create({
      data: {
        name: body.name,
        sourceType: body.sourceType || 'generic',
        baseUrl: body.baseUrl,
        apiKey: body.apiKey || null,
        apiSecret: body.apiSecret || null,
        webhookSecret: body.webhookSecret || null,
        headers: body.headers || null,
        active: body.active !== false,
        syncInterval: body.syncInterval || 60,
        mapping: body.mapping || null,
      },
    });
    return NextResponse.json(source, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear API source';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

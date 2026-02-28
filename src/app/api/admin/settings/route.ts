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
  const settings = await prisma.siteSetting.findMany();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { settings } = await req.json();

    for (const [key, value] of Object.entries(settings as Record<string, string>)) {
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value || '' },
        update: { value: value || '' },
      });
    }

    return NextResponse.json({ message: 'Configuración guardada' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

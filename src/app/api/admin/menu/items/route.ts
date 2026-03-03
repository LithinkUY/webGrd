import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const item = await prisma.menuItem.create({
      data: {
        label: body.label,
        href: body.href,
        icon: body.icon || null,
        parentId: body.parentId || null,
        sortOrder: body.sortOrder || 0,
        active: body.active !== false,
        openNew: body.openNew || false,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// GET /api/admin/api-sources/[id] - Obtener una API source
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  const source = await prisma.apiSource.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  return NextResponse.json(source);
}

// PUT /api/admin/api-sources/[id] - Actualizar una API source
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const source = await prisma.apiSource.update({
      where: { id },
      data: {
        name: body.name,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        webhookSecret: body.webhookSecret,
        headers: body.headers,
        active: body.active,
        syncInterval: body.syncInterval,
        mapping: body.mapping,
      },
    });
    return NextResponse.json(source);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/api-sources/[id] - Eliminar una API source
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    // Eliminar logs asociados primero
    await prisma.syncLog.deleteMany({ where: { apiSourceId: id } });
    await prisma.apiSource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.slug = slugify(body.name, { lower: true, strict: true });
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.parentId !== undefined) updateData.parentId = body.parentId || null;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.active !== undefined) updateData.active = body.active;

    const category = await prisma.category.update({ where: { id }, data: updateData });
    return NextResponse.json(category);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: 'Categoría eliminada' });
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar (tiene productos o subcategorías)' }, { status: 400 });
  }
}

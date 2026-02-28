import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Verificar que la dirección pertenece al usuario
  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id as string },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
  }

  // Si es default, quitar default de las demás
  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id as string, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.fullName !== undefined && { fullName: body.fullName }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.zipCode !== undefined && { zipCode: body.zipCode }),
      ...(body.country !== undefined && { country: body.country }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id as string },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

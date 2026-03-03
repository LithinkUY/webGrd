import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// GET /api/admin/coupons/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: { orders: { select: { id: true, orderNumber: true, total: true, createdAt: true } } },
  });

  if (!coupon) return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
  return NextResponse.json(coupon);
}

// PUT /api/admin/coupons/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = parseFloat(body.value);
    if (body.minPurchase !== undefined) updateData.minPurchase = body.minPurchase ? parseFloat(body.minPurchase) : null;
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount ? parseFloat(body.maxDiscount) : null;
    if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit ? parseInt(body.usageLimit) : null;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.active !== undefined) updateData.active = body.active;

    // Check code uniqueness if changing
    if (updateData.code) {
      const exists = await prisma.coupon.findFirst({
        where: { code: updateData.code as string, NOT: { id } },
      });
      if (exists) {
        return NextResponse.json({ error: 'Ya existe otro cupón con ese código' }, { status: 400 });
      }
    }

    const coupon = await prisma.coupon.update({ where: { id }, data: updateData });
    return NextResponse.json({ coupon });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

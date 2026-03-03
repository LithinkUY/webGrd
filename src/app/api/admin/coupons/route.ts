import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// GET /api/admin/coupons
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const activeFilter = searchParams.get('active');

  const where: Record<string, unknown> = {};
  if (search) where.code = { contains: search, mode: 'insensitive' };
  if (activeFilter !== null && activeFilter !== '') where.active = activeFilter === 'true';

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.coupon.count({ where }),
  ]);

  return NextResponse.json({ coupons, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/admin/coupons - Crear cupón
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { code, description, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate, active } = body;

    if (!code || !value) {
      return NextResponse.json({ error: 'Código y valor son requeridos' }, { status: 400 });
    }

    const exists = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (exists) {
      return NextResponse.json({ error: 'Ya existe un cupón con ese código' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        type: type || 'percentage',
        value: parseFloat(value),
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: active !== false,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear cupón';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

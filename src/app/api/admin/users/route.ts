import bcrypt from 'bcryptjs';
// POST: crear usuario
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const session = await getServerSession(authOptions);
  const isStoreAdmin = session?.user?.role === 'store_admin';
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }
  // store_admin no puede crear usuarios con rol admin
  if (isStoreAdmin && role === 'admin') {
    return NextResponse.json({ error: 'No autorizado para asignar ese rol' }, { status: 403 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: 'El email ya existe' }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role: role || 'customer',
      active: true,
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

// PUT: actualizar rol o estado
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const session = await getServerSession(authOptions);
  const isStoreAdmin = session?.user?.role === 'store_admin';
  const { id, role, active } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  // store_admin no puede asignar rol admin ni modificar usuarios admin
  if (isStoreAdmin) {
    if (role === 'admin') return NextResponse.json({ error: 'No autorizado para asignar ese rol' }, { status: 403 });
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === 'admin') return NextResponse.json({ error: 'No autorizado para modificar ese usuario' }, { status: 403 });
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(role ? { role } : {}),
      ...(active !== undefined ? { active } : {}),
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

// DELETE: eliminar usuario
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const session = await getServerSession(authOptions);
  const isStoreAdmin = session?.user?.role === 'store_admin';
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  // store_admin no puede eliminar usuarios admin
  if (isStoreAdmin) {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === 'admin') return NextResponse.json({ error: 'No autorizado para eliminar ese usuario' }, { status: 403 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const session = await getServerSession(authOptions);
  const isStoreAdmin = session?.user?.role === 'store_admin';

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role');

  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { name: { contains: search } },
    { email: { contains: search } },
  ];
  if (role) where.role = role;
  // store_admin no puede ver usuarios con rol admin
  if (isStoreAdmin) {
    where.NOT = { role: 'admin' };
  }
  const activeParam = searchParams.get('active');
  if (activeParam === 'true') where.active = true;
  if (activeParam === 'false') where.active = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        company: true, rut: true, active: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

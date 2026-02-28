import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      rut: true,
      address: true,
      city: true,
      avatar: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, company, rut, address, city } = body;

  const user = await prisma.user.update({
    where: { id: session.user.id as string },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(company !== undefined && { company }),
      ...(rut !== undefined && { rut }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      rut: true,
      address: true,
      city: true,
    },
  });

  return NextResponse.json(user);
}

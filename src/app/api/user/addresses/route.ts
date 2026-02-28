import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id as string },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { label, fullName, phone, address, city, state, zipCode, country, isDefault } = body;

  if (!fullName || !address || !city) {
    return NextResponse.json({ error: 'Nombre, dirección y ciudad son obligatorios' }, { status: 400 });
  }

  // Si es default, quitar default de las demás
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id as string },
      data: { isDefault: false },
    });
  }

  const newAddress = await prisma.address.create({
    data: {
      userId: session.user.id as string,
      label: label || 'Casa',
      fullName,
      phone: phone || null,
      address,
      city,
      state: state || null,
      zipCode: zipCode || null,
      country: country || 'Uruguay',
      isDefault: isDefault || false,
    },
  });

  return NextResponse.json(newAddress, { status: 201 });
}

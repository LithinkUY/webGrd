import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id as string },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}

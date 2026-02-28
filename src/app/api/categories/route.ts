import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { active: true, parentId: null },
    include: {
      children: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(categories);
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      where: { active: true, showInMenu: true, parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        menuOrder: true,
        children: {
          where: { active: true, showInMenu: true },
          select: { id: true, name: true, slug: true, icon: true, menuOrder: true },
          orderBy: { menuOrder: 'asc' },
        },
      },
      orderBy: { menuOrder: 'asc' },
    }),
    prisma.menuItem.findMany({
      where: { active: true, parentId: null },
      select: {
        id: true,
        label: true,
        href: true,
        icon: true,
        sortOrder: true,
        openNew: true,
        children: {
          where: { active: true },
          select: { id: true, label: true, href: true, icon: true, sortOrder: true, openNew: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return NextResponse.json({ categories, menuItems });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// GET — traer categorías con sus campos de menú + items custom
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      include: {
        children: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, slug: true, showInMenu: true, menuOrder: true, icon: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: { menuOrder: 'asc' },
    }),
    prisma.menuItem.findMany({
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
      },
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return NextResponse.json({ categories, menuItems });
}

// PUT — actualizar visibilidad y orden de categorías en el menú
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();

    // body.categories = [{ id, showInMenu, menuOrder }]
    if (body.categories && Array.isArray(body.categories)) {
      const updates = body.categories.map((cat: { id: string; showInMenu: boolean; menuOrder: number }) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { showInMenu: cat.showInMenu, menuOrder: cat.menuOrder },
        })
      );
      await Promise.all(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

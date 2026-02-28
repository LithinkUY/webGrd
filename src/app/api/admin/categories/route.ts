import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const categories = await prisma.category.findMany({
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const slug = slugify(body.name, { lower: true, strict: true });

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        image: body.image || null,
        icon: body.icon || null,
        parentId: body.parentId || null,
        sortOrder: body.sortOrder || 0,
        active: body.active !== false,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear categoría';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

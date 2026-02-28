import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { shortDesc: { contains: q } },
        { tags: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      stock: true,
      images: true,
      sku: true,
      brand: { select: { name: true } },
    },
    take: 8,
    orderBy: [
      { featured: 'desc' },
      { stock: 'desc' },
    ],
  });

  const results = products.map((p) => {
    let firstImage = '';
    try {
      const imgs = JSON.parse(p.images);
      if (Array.isArray(imgs) && imgs.length > 0) firstImage = imgs[0];
    } catch { /* empty */ }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      stock: p.stock,
      image: firstImage,
      sku: p.sku,
      brand: p.brand?.name || null,
    };
  });

  return NextResponse.json(results);
}

import { prisma } from '@/lib/prisma';
import ProductsClient from './ProductsClient';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; brand?: string; search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const where: any = { active: true };

  if (params.cat) {
    where.category = { slug: params.cat };
  }
  if (params.brand) {
    where.brand = { slug: params.brand };
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { sku: { contains: params.search } },
    ];
  }

  const orderBy: any =
    params.sort === 'price_asc' ? { price: 'asc' }
    : params.sort === 'price_desc' ? { price: 'desc' }
    : params.sort === 'name' ? { name: 'asc' }
    : { createdAt: 'desc' };

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: 80,
      select: {
        id: true, name: true, slug: true, price: true, comparePrice: true,
        images: true, sku: true, stock: true, isNew: true, featured: true,
        description: true,
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <ProductsClient
      products={products as any}
      categories={categories}
      brands={brands}
      currentCat={params.cat || ''}
      currentBrand={params.brand || ''}
      currentSearch={params.search || ''}
      currentSort={params.sort || ''}
    />
  );
}

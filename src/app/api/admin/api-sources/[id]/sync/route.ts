import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// ─── WooCommerce helpers ───────────────────────────────────────

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  regular_price: string;
  sale_price: string;
  price: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  description: string;
  short_description: string;
  images: { src: string }[];
  categories: { id: number; name: string; slug: string }[];
  status: string;
}

async function fetchWooCommerceProducts(
  baseUrl: string,
  consumerKey: string,
  consumerSecret: string,
): Promise<WooProduct[]> {
  // Normalizar URL base – quitar trailing slash
  const storeUrl = baseUrl.replace(/\/+$/, '');
  const allProducts: WooProduct[] = [];
  let page = 1;
  const perPage = 100; // máximo de WooCommerce

  while (true) {
    const url = `${storeUrl}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`;

    const res = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`WooCommerce API error ${res.status}: ${txt.slice(0, 200)}`);
    }

    const products: WooProduct[] = await res.json();
    if (products.length === 0) break;

    allProducts.push(...products);

    // Verificar si hay más páginas
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1');
    if (page >= totalPages) break;
    page++;
  }

  return allProducts;
}

async function syncWooCommerceProduct(
  item: WooProduct,
  sourceName: string,
) {
  const name = item.name || 'Sin nombre';
  const price = parseFloat(item.regular_price || item.price || '0');
  const comparePrice = item.sale_price ? parseFloat(item.sale_price) : null;
  const sku = item.sku || `WC-${item.id}`;
  const stock = item.manage_stock ? (item.stock_quantity ?? 0) : 999;
  const description = item.description || item.short_description || null;
  const imageUrls = item.images?.map((img) => img.src) || [];
  const sourceProductId = String(item.id);

  // Buscar si ya existe
  const existing = await prisma.product.findFirst({
    where: { sourceId: sourceProductId, sourceApi: sourceName },
  });

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        name,
        price,
        comparePrice,
        stock,
        description,
        images: JSON.stringify(imageUrls),
      },
    });
    return 'updated';
  }

  // Resolver categoría
  let categoryId: string | null = null;
  if (item.categories?.length > 0) {
    const wcCat = item.categories[0];
    const catSlug = slugify(wcCat.name, { lower: true, strict: true });
    let cat = await prisma.category.findFirst({ where: { slug: catSlug } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: wcCat.name, slug: catSlug } });
    }
    categoryId = cat.id;
  }

  if (!categoryId) {
    let defaultCat = await prisma.category.findFirst({ where: { slug: 'woocommerce' } });
    if (!defaultCat) {
      defaultCat = await prisma.category.create({ data: { name: 'WooCommerce', slug: 'woocommerce' } });
    }
    categoryId = defaultCat.id;
  }

  await prisma.product.create({
    data: {
      name,
      slug: slugify(name, { lower: true, strict: true }) + '-' + Date.now(),
      sku,
      price,
      comparePrice,
      stock,
      description,
      images: JSON.stringify(imageUrls),
      categoryId,
      sourceId: sourceProductId,
      sourceApi: sourceName,
      active: true,
    },
  });

  return 'created';
}

// ─── Generic sync helpers ──────────────────────────────────────

interface GenericMapping {
  name?: string;
  price?: string;
  sku?: string;
  stock?: string;
  description?: string;
  images?: string;
  id?: string;
}

async function syncGenericProducts(
  source: { id: string; name: string; baseUrl: string; apiKey: string | null; headers: string | null; mapping: string | null },
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (source.apiKey) headers['Authorization'] = `Bearer ${source.apiKey}`;
  if (source.headers) {
    try { Object.assign(headers, JSON.parse(source.headers)); } catch { /* empty */ }
  }

  const res = await fetch(source.baseUrl, { headers });
  if (!res.ok) throw new Error(`API respondió con ${res.status}`);

  const externalData = await res.json();
  const items = Array.isArray(externalData) ? externalData : externalData.data || externalData.products || [];

  const mapping: GenericMapping = source.mapping ? JSON.parse(source.mapping) : {};
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const name = item[mapping.name || 'name'] || item.name || 'Sin nombre';
      const price = parseFloat(item[mapping.price || 'price'] || item.price || 0);
      const sku = item[mapping.sku || 'sku'] || item.sku || `EXT-${Date.now()}-${synced}`;
      const stock = parseInt(item[mapping.stock || 'stock'] || item.stock || 0);
      const description = item[mapping.description || 'description'] || item.description || null;
      const images = item[mapping.images || 'images'] || item.images || [];
      const sourceProductId = String(item[mapping.id || 'id'] || item.id || sku);

      const existing = await prisma.product.findFirst({
        where: { sourceId: sourceProductId, sourceApi: source.name },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { price, stock, name, description, images: JSON.stringify(Array.isArray(images) ? images : [images]) },
        });
      } else {
        let defaultCategory = await prisma.category.findFirst({ where: { slug: 'importados' } });
        if (!defaultCategory) {
          defaultCategory = await prisma.category.create({ data: { name: 'Importados', slug: 'importados' } });
        }

        await prisma.product.create({
          data: {
            name,
            slug: slugify(name, { lower: true, strict: true }) + '-' + Date.now(),
            sku,
            price,
            stock,
            description,
            images: JSON.stringify(Array.isArray(images) ? images : [images]),
            categoryId: defaultCategory.id,
            sourceId: sourceProductId,
            sourceApi: source.name,
            active: true,
          },
        });
      }

      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed, total: items.length };
}

// ─── Main POST handler ─────────────────────────────────────────

// POST /api/admin/api-sources/[id]/sync - Ejecutar sincronización
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  const source = await prisma.apiSource.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: 'API no encontrada' }, { status: 404 });

  const log = await prisma.syncLog.create({
    data: { apiSourceId: id, status: 'success', itemsSynced: 0, itemsFailed: 0 },
  });

  try {
    let synced = 0;
    let failed = 0;
    let total = 0;

    if (source.sourceType === 'woocommerce') {
      // ── WooCommerce sync ──
      if (!source.apiKey || !source.apiSecret) {
        throw new Error('WooCommerce requiere Consumer Key y Consumer Secret');
      }

      const products = await fetchWooCommerceProducts(
        source.baseUrl,
        source.apiKey,
        source.apiSecret,
      );
      total = products.length;

      for (const item of products) {
        try {
          await syncWooCommerceProduct(item, source.name);
          synced++;
        } catch {
          failed++;
        }
      }
    } else {
      // ── Generic API sync ──
      const result = await syncGenericProducts(source);
      synced = result.synced;
      failed = result.failed;
      total = result.total;
    }

    // Actualizar log y source
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        itemsSynced: synced,
        itemsFailed: failed,
        finishedAt: new Date(),
        status: failed > 0 && synced > 0 ? 'partial' : failed > 0 ? 'error' : 'success',
      },
    });

    await prisma.apiSource.update({
      where: { id },
      data: { lastSync: new Date() },
    });

    return NextResponse.json({ synced, failed, total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de sincronización';
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'error', errors: message, finishedAt: new Date() },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

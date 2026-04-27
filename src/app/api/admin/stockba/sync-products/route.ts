import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  return role === 'admin' || role === 'ADMIN';
}
import prisma from '@/lib/prisma';
import { getAllStockBAProducts } from '@/lib/stockba';

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}
function ensureUniqueSlug(base: string, existing: Set<string>): string {
  let slug = base || 'item'; let i = 2;
  while (existing.has(slug)) { slug = base + '-' + i++; }
  existing.add(slug); return slug;
}
async function getDefaultCategoryId(): Promise<string> {
  let cat = await prisma.category.findFirst({ where: { slug: 'sin-categoria' } });
  if (!cat) cat = await prisma.category.create({ data: { name: 'Sin Categoria', slug: 'sin-categoria' } });
  return cat.id;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const syncImages: boolean = body.syncImages === true;   // default FALSE
  const overwritePrice: boolean = body.overwritePrice === true; // default FALSE
  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  let stockbaProducts: any[];
  try {
    stockbaProducts = await getAllStockBAProducts();
  } catch (err: any) {
    return NextResponse.json({ error: 'Error en la API de StockBA: ' + err.message + '. Verificá que la API de StockBA esté funcionando correctamente.' }, { status: 502 });
  }

  const existingSlugs = await prisma.product.findMany({ select: { slug: true } });
  const slugSet = new Set<string>(existingSlugs.map((p: { slug: string }) => p.slug));
  const defaultCategoryId = await getDefaultCategoryId();
  const catSlugs = new Set<string>((await prisma.category.findMany({ select: { slug: true } })).map((c: { slug: string }) => c.slug));
  const brandSlugs = new Set<string>((await prisma.brand.findMany({ select: { slug: true } })).map((b: { slug: string }) => b.slug));

  for (const sp of stockbaProducts) {
    try {
      let categoryId: string = defaultCategoryId;
      if (sp.category?.name) {
        let cat = await prisma.category.findFirst({ where: { name: { equals: sp.category.name, mode: 'insensitive' } } });
        if (!cat) {
          const catSlug = ensureUniqueSlug(slugify(sp.category.name) || 'categoria', catSlugs);
          cat = await prisma.category.create({ data: { name: sp.category.name, slug: catSlug } });
        }
        categoryId = cat.id;
      }
      let brandId: string | null = null;
      if (sp.brand?.name) {
        let brand = await prisma.brand.findFirst({ where: { name: { equals: sp.brand.name, mode: 'insensitive' } } });
        if (!brand) {
          const brandSlug = ensureUniqueSlug(slugify(sp.brand.name) || 'marca', brandSlugs);
          brand = await prisma.brand.create({ data: { name: sp.brand.name, slug: brandSlug } });
        }
        brandId = brand.id;
      }
      let stockQty = 0; // use sync-stock route to update stock separately
      const sku = sp.sku && String(sp.sku).trim() ? String(sp.sku).trim() : ('SBA-' + sp.id);
      const images: string | undefined = syncImages && sp.image_url ? JSON.stringify([sp.image_url]) : undefined;
      const existing = await prisma.product.findFirst({ where: { sourceId: String(sp.id), sourceApi: 'stockba' } });
      if (existing) {
        const upd: any = { name: sp.name, sku, stock: stockQty, active: sp.active ?? true, categoryId };
        if (overwritePrice) upd.price = Number(sp.selling_price ?? 0);
        if (images) upd.images = images;
        if (brandId) upd.brandId = brandId;
        await prisma.product.update({ where: { id: existing.id }, data: upd });
        results.updated++;
      } else {
        const slug = ensureUniqueSlug(slugify(sp.name) || ('sba-' + sp.id), slugSet);
        const d: any = { name: sp.name, slug, sku, price: Number(sp.selling_price ?? 0), stock: stockQty, active: sp.active ?? true, sourceId: String(sp.id), sourceApi: 'stockba', images: images ?? '[]', categoryId };
        if (sp.purchase_price != null) d.cost = Number(sp.purchase_price);
        if (brandId) d.brandId = brandId;
        await prisma.product.create({ data: d });
        results.created++;
      }
    } catch (err: any) {
      results.errors.push('[' + sp.id + '] ' + (sp.name ?? 'unknown') + ': ' + err.message);
      results.skipped++;
    }
  }

  return NextResponse.json({ ok: true, ...results, total: stockbaProducts.length });
}
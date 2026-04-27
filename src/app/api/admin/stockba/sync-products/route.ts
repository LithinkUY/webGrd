import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import { getAllStockBAProducts, getStockBAProductStock } from '@/lib/stockba';

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}

function ensureUniqueSlug(base: string, existing: Set<string>): string {
  let slug = base; let i = 2;
  while (existing.has(slug)) { slug = base + '-' + i++; }
  existing.add(slug); return slug;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const syncImages: boolean = body.syncImages !== false;
  const overwritePrice: boolean = body.overwritePrice === true;
  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };
  try {
    const stockbaProducts = await getAllStockBAProducts();
    const existingSlugs = await prisma.product.findMany({ select: { slug: true } });
    const slugSet = new Set<string>(existingSlugs.map((p: { slug: string }) => p.slug));
    for (const sp of stockbaProducts) {
      try {
        let categoryId: string | null = null;
        if (sp.category?.name) {
          let cat = await prisma.category.findFirst({ where: { name: { equals: sp.category.name, mode: 'insensitive' } } });
          if (!cat) cat = await prisma.category.create({ data: { name: sp.category.name, slug: ensureUniqueSlug(slugify(sp.category.name), new Set<string>()) } });
          categoryId = cat.id;
        }
        let brandId: string | null = null;
        if (sp.brand?.name) {
          let brand = await prisma.brand.findFirst({ where: { name: { equals: sp.brand.name, mode: 'insensitive' } } });
          if (!brand) brand = await prisma.brand.create({ data: { name: sp.brand.name, slug: ensureUniqueSlug(slugify(sp.brand.name), new Set<string>()) } });
          brandId = brand.id;
        }
        let stockQty = 0;
        try {
          const stockRes = await getStockBAProductStock(Number(sp.id));
          if (Array.isArray(stockRes.data)) stockQty = stockRes.data.reduce((s: number, l: any) => s + (l.quantity ?? 0), 0);
          else if (typeof stockRes.quantity === 'number') stockQty = stockRes.quantity;
        } catch { /* keep 0 */ }
        const images: string | undefined = syncImages && sp.image_url ? JSON.stringify([sp.image_url]) : undefined;
        const existing = await prisma.product.findFirst({ where: { sourceId: String(sp.id), sourceApi: 'stockba' } });
        if (existing) {
          const upd: any = { name: sp.name, sku: sp.sku || null, stock: stockQty, active: sp.active ?? true };
          if (overwritePrice) upd.price = Number(sp.selling_price ?? 0);
          if (images) upd.images = images;
          if (categoryId) upd.categoryId = categoryId;
          if (brandId) upd.brandId = brandId;
          await prisma.product.update({ where: { id: existing.id }, data: upd });
          results.updated++;
        } else {
          const slug = ensureUniqueSlug(slugify(sp.name) || ('product-' + sp.id), slugSet);
          const d: any = { name: sp.name, slug, sku: sp.sku || null, price: Number(sp.selling_price ?? 0), stock: stockQty, active: sp.active ?? true, sourceId: String(sp.id), sourceApi: 'stockba', images: images ?? '[]' };
          if (sp.purchase_price != null) d.cost = Number(sp.purchase_price);
          if (categoryId) d.categoryId = categoryId;
          if (brandId) d.brandId = brandId;
          await prisma.product.create({ data: d });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push('[' + sp.id + '] ' + sp.name + ': ' + err.message);
        results.skipped++;
      }
    }
    return NextResponse.json({ ok: true, ...results, total: stockbaProducts.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
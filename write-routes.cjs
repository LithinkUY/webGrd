const fs = require('fs');
const base = 'src/app/api/admin/stockba';

// ── Shared auth header ────────────────────────────────────────────────────────
const AUTH = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  return role === 'admin' || role === 'ADMIN';
}
`;

// ── sync-products: uses in-memory Maps — avoids per-product DB queries ────────
const syncProducts = AUTH + `import prisma from '@/lib/prisma';
import { getAllStockBAProducts } from '@/lib/stockba';

function sl(t: string) {
  return t.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}
function uslug(base: string, used: Set<string>): string {
  let s = base || 'item'; let i = 2;
  while (used.has(s)) s = base + '-' + i++;
  used.add(s); return s;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const syncImages: boolean = body.syncImages === true;
  const overwritePrice: boolean = body.overwritePrice === true;
  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  let sbaProducts: any[];
  try { sbaProducts = await getAllStockBAProducts(); }
  catch (err: any) { return NextResponse.json({ error: 'Error API StockBA: ' + err.message }, { status: 502 }); }

  // Pre-load all DB data into Maps to avoid N+1 queries
  const [cats, brands, existing, slugs] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.product.findMany({ where: { sourceApi: 'stockba' }, select: { id: true, sourceId: true } }),
    prisma.product.findMany({ select: { slug: true } }),
  ]);
  const catMap = new Map<string, string>(cats.map((c: any) => [c.name.toLowerCase(), c.id]));
  const catSlugs = new Set<string>(cats.map((c: any) => c.slug));
  const brandMap = new Map<string, string>(brands.map((b: any) => [b.name.toLowerCase(), b.id]));
  const brandSlugs = new Set<string>(brands.map((b: any) => b.slug));
  const existMap = new Map<string, string>(existing.map((p: any) => [p.sourceId, p.id]));
  const slugSet = new Set<string>(slugs.map((p: any) => p.slug));

  // Ensure default category exists
  let defCatId: string;
  if (catMap.has('sin categoria')) {
    defCatId = catMap.get('sin categoria')!;
  } else {
    const c = await prisma.category.create({ data: { name: 'Sin Categoria', slug: 'sin-categoria' } });
    defCatId = c.id; catMap.set('sin categoria', c.id); catSlugs.add('sin-categoria');
  }

  for (const sp of sbaProducts) {
    try {
      // Category
      let catId = defCatId;
      if (sp.category?.name) {
        const k = sp.category.name.toLowerCase();
        if (catMap.has(k)) { catId = catMap.get(k)!; }
        else {
          const s = uslug(sl(sp.category.name) || 'cat', catSlugs);
          const c = await prisma.category.create({ data: { name: sp.category.name, slug: s } });
          catMap.set(k, c.id); catId = c.id;
        }
      }
      // Brand
      let brandId: string | null = null;
      if (sp.brand?.name) {
        const k = sp.brand.name.toLowerCase();
        if (brandMap.has(k)) { brandId = brandMap.get(k)!; }
        else {
          const s = uslug(sl(sp.brand.name) || 'marca', brandSlugs);
          const b = await prisma.brand.create({ data: { name: sp.brand.name, slug: s } });
          brandMap.set(k, b.id); brandId = b.id;
        }
      }
      const sku = sp.sku && String(sp.sku).trim() ? String(sp.sku).trim() : ('SBA-' + sp.id);
      // Prices: main product often has 0 — check variations[0] (DUMMY variation) for real prices
      const v0 = Array.isArray(sp.variations) && sp.variations.length > 0 ? sp.variations[0] : null;
      const rawPrice = Number(sp.selling_price_inc_tax ?? sp.selling_price ?? 0);
      const rawCost  = sp.purchase_price != null ? Number(sp.purchase_price) : null;
      const price = rawPrice > 0 ? rawPrice : Number(v0?.selling_price ?? v0?.price ?? 0);
      const cost  = rawCost != null && rawCost > 0 ? rawCost : (v0?.purchase_price != null ? Number(v0.purchase_price) : undefined);
      const images = syncImages && sp.image_url ? JSON.stringify([sp.image_url]) : undefined;

      const existId = existMap.get(String(sp.id));
      if (existId) {
        const upd: any = { name: sp.name, sku, active: sp.active ?? true, categoryId: catId };
        if (overwritePrice) { upd.price = price; if (cost != null) upd.cost = cost; }
        if (images) upd.images = images;
        if (brandId) upd.brandId = brandId;
        await prisma.product.update({ where: { id: existId }, data: upd });
        results.updated++;
      } else {
        const slug = uslug(sl(sp.name) || ('sba-' + sp.id), slugSet);
        const d: any = {
          name: sp.name, slug, sku, price, stock: 0, active: sp.active ?? true,
          sourceId: String(sp.id), sourceApi: 'stockba', images: images ?? '[]', categoryId: catId,
        };
        if (cost != null) d.cost = cost;
        if (brandId) d.brandId = brandId;
        await prisma.product.create({ data: d });
        existMap.set(String(sp.id), 'done');
        results.created++;
      }
    } catch (err: any) {
      results.errors.push('[' + sp.id + '] ' + (sp.name ?? '?') + ': ' + err.message);
      results.skipped++;
    }
  }
  return NextResponse.json({ ok: true, ...results, total: sbaProducts.length });
}
`;

// ── sync-stock ────────────────────────────────────────────────────────────────
const syncStock = AUTH + `import prisma from '@/lib/prisma';
import { getStockBAProductStock } from '@/lib/stockba';

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const results = { updated: 0, skipped: 0, errors: [] as string[] };
  try {
    const products = await prisma.product.findMany({
      where: { sourceApi: 'stockba', sourceId: { not: null } },
      select: { id: true, sourceId: true, name: true },
    });
    for (const p of products) {
      if (!p.sourceId) continue;
      try {
        const res = await getStockBAProductStock(Number(p.sourceId));
        let qty = 0;
        if (Array.isArray(res.data)) qty = res.data.reduce((s: number, l: any) => s + (l.quantity ?? 0), 0);
        else if (typeof res.quantity === 'number') qty = res.quantity;
        await prisma.product.update({ where: { id: p.id }, data: { stock: qty } });
        results.updated++;
      } catch (err: any) {
        results.errors.push('[' + p.sourceId + '] ' + p.name + ': ' + err.message);
        results.skipped++;
      }
    }
    return NextResponse.json({ ok: true, ...results, total: products.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`;

// ── status (public) ───────────────────────────────────────────────────────────
const status = `import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const apiKeyConfigured = !!process.env.STOCKBA_API_KEY;
  try {
    const syncedProducts = await prisma.product.count({ where: { sourceApi: 'stockba' } });
    const last = await prisma.product.findFirst({
      where: { sourceApi: 'stockba' }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true },
    });
    return NextResponse.json({ ok: true, apiKeyConfigured, syncedProducts, lastSyncAt: last?.updatedAt ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, apiKeyConfigured, syncedProducts: 0, lastSyncAt: null, error: err.message });
  }
}
`;

fs.writeFileSync(base + '/sync-products/route.ts', syncProducts, 'utf8');
fs.writeFileSync(base + '/sync-stock/route.ts', syncStock, 'utf8');
fs.writeFileSync(base + '/status/route.ts', status, 'utf8');
console.log('Done. sync-products uses in-memory Maps (no N+1 queries).');

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getAllStockBAProducts, getStockBAProductStock } from '@/lib/stockba';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function ensureUniqueSlug(base: string, existing: Set<string>): string {
    let slug = base;
    let i = 2;
    while (existing.has(slug)) {
        slug = `${base}-${i++}`;
    }
    existing.add(slug);
    return slug;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const syncImages = body.syncImages !== false; // default true
    const overwritePrice = body.overwritePrice === true; // default false

    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    try {
        const stockbaProducts = await getAllStockBAProducts();

        // Pre-load existing slugs to avoid duplicates
        const existingSlugs = await prisma.product.findMany({ select: { slug: true } });
        const slugSet = new Set<string>(existingSlugs.map((p: { slug: string }) => p.slug)); for (const sp of stockbaProducts) {
            try {
                // ── Resolve category ─────────────────────────────────
                let categoryId: string | null = null;
                if (sp.category?.name) {
                    let cat = await prisma.category.findFirst({
                        where: { name: { equals: sp.category.name, mode: 'insensitive' } },
                    });
                    if (!cat) {
                        const catSlug = ensureUniqueSlug(
                            slugify(sp.category.name),
                            new Set<string>()
                        );
                        cat = await prisma.category.create({
                            data: { name: sp.category.name, slug: catSlug },
                        });
                    }
                    categoryId = cat.id;
                }

                // ── Resolve brand ────────────────────────────────────
                let brandId: string | null = null;
                if (sp.brand?.name) {
                    let brand = await prisma.brand.findFirst({
                        where: { name: { equals: sp.brand.name, mode: 'insensitive' } },
                    });
                    if (!brand) {
                        const brandSlug = ensureUniqueSlug(
                            slugify(sp.brand.name),
                            new Set<string>()
                        );
                        brand = await prisma.brand.create({
                            data: { name: sp.brand.name, slug: brandSlug },
                        });
                    }
                    brandId = brand.id;
                }

                // ── Stock ────────────────────────────────────────────
                let stockQty = 0;
                try {
                    const stockRes = await getStockBAProductStock(sp.id);
                    // Sum all locations
                    if (Array.isArray(stockRes.data)) {
                        stockQty = stockRes.data.reduce(
                            (sum: number, loc: any) => sum + (loc.quantity ?? 0),
                            0
                        );
                    } else if (typeof stockRes.quantity === 'number') {
                        stockQty = stockRes.quantity;
                    }
                } catch {
                    // stock unavailable — keep 0
                }

                // ── Images ───────────────────────────────────────────
                const images = syncImages && sp.image_url ? JSON.stringify([sp.image_url]) : undefined;

                // ── Upsert ───────────────────────────────────────────
                const existing = await prisma.product.findFirst({
                    where: { sourceId: String(sp.id), sourceApi: 'stockba' },
                });

                if (existing) {
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            name: sp.name,
                            sku: sp.sku || null,
                            stock: stockQty,
                            active: sp.active ?? true,
                            ...(overwritePrice ? { price: sp.selling_price ?? 0 } : {}),
                            ...(images ? { images } : {}),
                            category: categoryId ? { connect: { id: categoryId } } : undefined,
                            brand: brandId ? { connect: { id: brandId } } : undefined,
                        },
                    });
                    results.updated++;
                } else {
                    const baseSlug = slugify(sp.name) || `product-${sp.id}`;
                    const slug = ensureUniqueSlug(baseSlug, slugSet);
                    await prisma.product.create({
                        data: {
                            name: sp.name,
                            slug,
                            sku: sp.sku || null,
                            price: sp.selling_price ?? 0,
                            cost: sp.purchase_price ?? null,
                            stock: stockQty,
                            active: sp.active ?? true,
                            sourceId: String(sp.id),
                            sourceApi: 'stockba',
                            images: images ?? '[]',
                            category: categoryId ? { connect: { id: categoryId } } : undefined,
                            brand: brandId ? { connect: { id: brandId } } : undefined,
                        },
                    });
                    results.created++;
                }
            } catch (err: any) {
                results.errors.push(`[${sp.id}] ${sp.name}: ${err.message}`);
                results.skipped++;
            }
        }

        return NextResponse.json({ ok: true, ...results, total: stockbaProducts.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

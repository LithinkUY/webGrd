import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

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
    // Construir headers
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (source.apiKey) headers['Authorization'] = `Bearer ${source.apiKey}`;
    if (source.headers) {
      try { Object.assign(headers, JSON.parse(source.headers)); } catch { /* empty */ }
    }

    // Fetch de la API externa
    const res = await fetch(source.baseUrl, { headers });
    if (!res.ok) throw new Error(`API respondió con ${res.status}`);

    const externalData = await res.json();
    const items = Array.isArray(externalData) ? externalData : externalData.data || externalData.products || [];

    // Parsear mapeo
    const mapping = source.mapping ? JSON.parse(source.mapping) : {};
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

        // Buscar si ya existe
        const existing = await prisma.product.findFirst({
          where: { sourceId: sourceProductId, sourceApi: source.name },
        });

        if (existing) {
          // Actualizar
          await prisma.product.update({
            where: { id: existing.id },
            data: { price, stock, name, description, images: JSON.stringify(Array.isArray(images) ? images : [images]) },
          });
        } else {
          // Necesitamos una categoría por defecto
          let defaultCategory = await prisma.category.findFirst({ where: { slug: 'importados' } });
          if (!defaultCategory) {
            defaultCategory = await prisma.category.create({
              data: { name: 'Importados', slug: 'importados' },
            });
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

    // Actualizar log y source
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { itemsSynced: synced, itemsFailed: failed, finishedAt: new Date(), status: failed > 0 ? 'partial' : 'success' },
    });

    await prisma.apiSource.update({
      where: { id },
      data: { lastSync: new Date() },
    });

    return NextResponse.json({ synced, failed, total: items.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de sincronización';
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'error', errors: message, finishedAt: new Date() },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

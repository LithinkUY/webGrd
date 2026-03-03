import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import slugify from 'slugify';
import crypto from 'crypto';

// ─── Tipos WooCommerce ──────────────────────────────────────────

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

// ─── Verificar firma HMAC-SHA256 de WooCommerce ─────────────────

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

// ─── Sincronizar un producto individual ─────────────────────────

async function syncSingleProduct(item: WooProduct, sourceName: string) {
  const name = item.name || 'Sin nombre';
  const price = parseFloat(item.regular_price || item.price || '0');
  const comparePrice = item.sale_price ? parseFloat(item.sale_price) : null;
  const sku = item.sku || `WC-${item.id}`;
  const stock = item.manage_stock ? (item.stock_quantity ?? 0) : 999;
  const description = item.description || item.short_description || null;
  const imageUrls = item.images?.map((img) => img.src) || [];
  const sourceProductId = String(item.id);

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
        active: item.status === 'publish',
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
      active: item.status === 'publish',
    },
  });

  return 'created';
}

// ─── Eliminar producto por sourceId ─────────────────────────────

async function deleteProductBySourceId(wcProductId: number, sourceName: string) {
  const existing = await prisma.product.findFirst({
    where: { sourceId: String(wcProductId), sourceApi: sourceName },
  });
  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: { active: false },
    });
    return 'deactivated';
  }
  return 'not_found';
}

// ─── POST Handler ───────────────────────────────────────────────

// POST /api/webhooks/woocommerce/[sourceId]
// Recibe webhooks de WooCommerce (product.created, product.updated, product.deleted)
export async function POST(req: NextRequest, { params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params;

  try {
    // Buscar la fuente API
    const source = await prisma.apiSource.findUnique({ where: { id: sourceId } });
    if (!source || source.sourceType !== 'woocommerce') {
      return NextResponse.json({ error: 'Fuente no encontrada o no es WooCommerce' }, { status: 404 });
    }

    if (!source.active) {
      return NextResponse.json({ error: 'Fuente desactivada' }, { status: 403 });
    }

    // Leer body raw para verificar firma
    const rawBody = await req.text();

    // Verificar firma si hay webhookSecret configurado
    if (source.webhookSecret) {
      const signature = req.headers.get('x-wc-webhook-signature') || '';
      if (!signature) {
        return NextResponse.json({ error: 'Firma de webhook faltante' }, { status: 401 });
      }

      try {
        const valid = verifyWebhookSignature(rawBody, signature, source.webhookSecret);
        if (!valid) {
          return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: 'Error verificando firma' }, { status: 401 });
      }
    }

    // Detectar topic del webhook
    const topic = req.headers.get('x-wc-webhook-topic') || '';
    const payload = JSON.parse(rawBody);

    // WooCommerce envía un ping inicial al crear el webhook
    if (topic === '' || req.headers.get('x-wc-webhook-id') === null) {
      // Podría ser un ping - verificar si tiene el campo webhook_id
      if (payload.webhook_id) {
        return NextResponse.json({ success: true, message: 'Webhook ping recibido' });
      }
    }

    // Crear log de sincronización
    const log = await prisma.syncLog.create({
      data: { apiSourceId: sourceId, status: 'success', itemsSynced: 0, itemsFailed: 0 },
    });

    let result = '';

    if (topic === 'product.created' || topic === 'product.updated' || topic === 'product.restored') {
      // Sincronizar producto individual
      const product = payload as WooProduct;
      result = await syncSingleProduct(product, source.name);

      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          itemsSynced: 1,
          finishedAt: new Date(),
          status: 'success',
        },
      });
    } else if (topic === 'product.deleted') {
      // Desactivar producto
      const wcProductId = payload.id as number;
      result = await deleteProductBySourceId(wcProductId, source.name);

      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          itemsSynced: result === 'deactivated' ? 1 : 0,
          finishedAt: new Date(),
          status: 'success',
        },
      });
    } else {
      // Topic no soportado pero no es error
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          finishedAt: new Date(),
          status: 'success',
          errors: `Topic no manejado: ${topic}`,
        },
      });
      return NextResponse.json({ success: true, message: `Topic '${topic}' recibido pero no procesado` });
    }

    // Actualizar lastSync del source
    await prisma.apiSource.update({
      where: { id: sourceId },
      data: { lastSync: new Date() },
    });

    return NextResponse.json({ success: true, topic, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook';

    // Intentar registrar el error
    try {
      await prisma.syncLog.create({
        data: {
          apiSourceId: sourceId,
          status: 'error',
          itemsSynced: 0,
          itemsFailed: 1,
          errors: message,
          finishedAt: new Date(),
        },
      });
    } catch { /* no bloquear */ }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

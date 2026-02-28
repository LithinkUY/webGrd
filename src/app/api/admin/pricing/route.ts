import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — listar productos con info de precios
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';
  const source = searchParams.get('source') || ''; // 'cdr' para solo CDR
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (source === 'cdr') where.sourceApi = 'cdr-medios';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        comparePrice: true,
        cost: true,
        stock: true,
        active: true,
        featured: true,
        images: true,
        sourceApi: true,
        sourceId: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // También enviar categorías y marcas para filtros
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return NextResponse.json({
    products,
    total,
    pages: Math.ceil(total / limit),
    page,
    categories,
    brands,
  });
}

// POST — aplicar ajuste masivo de precios
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { action, percentage, productIds, categoryId, brandId, source } = body;

  // action: 'markup_from_cost' → precio = cost * (1 + percentage/100)
  // action: 'increase'         → precio = price * (1 + percentage/100)
  // action: 'decrease'         → precio = price * (1 - percentage/100)
  // action: 'set_compare'      → comparePrice = precio actual, luego aplicar descuento al price
  // action: 'clear_compare'    → quitar comparePrice

  if (!action) {
    return NextResponse.json({ error: 'Acción requerida' }, { status: 400 });
  }

  // Construir filtro
  const where: any = {};
  if (productIds && productIds.length > 0) {
    where.id = { in: productIds };
  } else {
    // Aplicar a todos según filtros
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (source === 'cdr') where.sourceApi = 'cdr-medios';
  }

  // Obtener productos afectados
  const products = await prisma.product.findMany({
    where,
    select: { id: true, price: true, cost: true, comparePrice: true },
  });

  if (products.length === 0) {
    return NextResponse.json({ error: 'No se encontraron productos para actualizar' }, { status: 404 });
  }

  // ── Crear backup automático ANTES de cambiar ──
  const actionLabels: Record<string, string> = {
    markup_from_cost: `Margen sobre costo +${percentage || 0}%`,
    increase: `Aumento +${percentage || 0}%`,
    decrease: `Reducción -${percentage || 0}%`,
    set_compare: `Oferta -${percentage || 0}%`,
    clear_compare: 'Quitar precio oferta',
  };
  try {
    const backupData = products.map(p => ({
      id: p.id,
      price: p.price,
      comparePrice: p.comparePrice,
      cost: p.cost,
    }));
    await prisma.priceBackup.create({
      data: {
        label: (actionLabels[action] || action) + ` (${products.length} productos)`,
        data: JSON.stringify(backupData),
        count: products.length,
      },
    });
    // Limpiar backups viejos (mantener solo los últimos 10)
    const allBackups = await prisma.priceBackup.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (allBackups.length > 10) {
      const toDelete = allBackups.slice(10).map(b => b.id);
      await prisma.priceBackup.deleteMany({ where: { id: { in: toDelete } } });
    }
  } catch (e) {
    console.error('Error creando backup de precios:', e);
    // No frenamos el proceso si el backup falla
  }

  let updated = 0;

  for (const product of products) {
    let newPrice = product.price;
    let newComparePrice = product.comparePrice;

    switch (action) {
      case 'markup_from_cost':
        // Calcular precio de venta a partir del costo CDR + margen %
        if (product.cost && product.cost > 0) {
          newPrice = Math.round(product.cost * (1 + (percentage || 0) / 100) * 100) / 100;
        }
        break;

      case 'increase':
        newPrice = Math.round(product.price * (1 + (percentage || 0) / 100) * 100) / 100;
        break;

      case 'decrease':
        newPrice = Math.round(product.price * (1 - (percentage || 0) / 100) * 100) / 100;
        break;

      case 'set_compare':
        // Poner el precio actual como comparePrice (tachado) y bajar el price
        newComparePrice = product.price;
        newPrice = Math.round(product.price * (1 - (percentage || 0) / 100) * 100) / 100;
        break;

      case 'clear_compare':
        newComparePrice = null;
        break;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: newPrice,
        comparePrice: newComparePrice,
      },
    });
    updated++;
  }

  return NextResponse.json({
    success: true,
    updated,
    message: `Se actualizaron ${updated} productos`,
  });
}

// PUT — editar precio individual
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { productId, price, comparePrice, cost } = body;

  if (!productId) {
    return NextResponse.json({ error: 'productId requerido' }, { status: 400 });
  }

  const data: any = {};
  if (price !== undefined) data.price = parseFloat(price);
  if (comparePrice !== undefined) data.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
  if (cost !== undefined) data.cost = cost ? parseFloat(cost) : null;

  const product = await prisma.product.update({
    where: { id: productId },
    data,
    select: {
      id: true,
      name: true,
      price: true,
      comparePrice: true,
      cost: true,
    },
  });

  return NextResponse.json({ success: true, product });
}

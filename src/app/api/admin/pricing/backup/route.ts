import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — listar backups
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const backups = await prisma.priceBackup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, label: true, count: true, createdAt: true },
  });

  return NextResponse.json({ backups });
}

// POST — restaurar un backup O crear backup manual
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  // ── Crear backup manual ──
  if (body.action === 'create') {
    const products = await prisma.product.findMany({
      select: { id: true, price: true, comparePrice: true, cost: true },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: 'No hay productos para respaldar' }, { status: 400 });
    }

    const backupData = products.map(p => ({
      id: p.id,
      price: p.price,
      comparePrice: p.comparePrice,
      cost: p.cost,
    }));

    const backup = await prisma.priceBackup.create({
      data: {
        label: body.label || `Backup manual (${products.length} productos)`,
        data: JSON.stringify(backupData),
        count: products.length,
      },
    });

    // Limpiar backups viejos (mantener últimos 10)
    const allBackups = await prisma.priceBackup.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (allBackups.length > 10) {
      const toDelete = allBackups.slice(10).map(b => b.id);
      await prisma.priceBackup.deleteMany({ where: { id: { in: toDelete } } });
    }

    return NextResponse.json({
      success: true,
      message: `Backup creado con ${products.length} productos`,
      backupId: backup.id,
    });
  }

  // ── Restaurar un backup ──
  const { backupId } = body;

  if (!backupId) {
    return NextResponse.json({ error: 'backupId requerido' }, { status: 400 });
  }

  const backup = await prisma.priceBackup.findUnique({ where: { id: backupId } });
  if (!backup) {
    return NextResponse.json({ error: 'Backup no encontrado' }, { status: 404 });
  }

  let items: { id: string; price: number; comparePrice: number | null; cost: number | null }[];
  try {
    items = JSON.parse(backup.data);
  } catch {
    return NextResponse.json({ error: 'Datos del backup corruptos' }, { status: 500 });
  }

  let restored = 0;
  for (const item of items) {
    try {
      await prisma.product.update({
        where: { id: item.id },
        data: {
          price: item.price,
          comparePrice: item.comparePrice,
          cost: item.cost,
        },
      });
      restored++;
    } catch {
      // producto ya no existe, lo saltamos
    }
  }

  return NextResponse.json({
    success: true,
    restored,
    message: `Se restauraron ${restored} de ${items.length} productos`,
  });
}

// DELETE — eliminar un backup
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }

  await prisma.priceBackup.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

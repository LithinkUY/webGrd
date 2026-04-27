import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import { getStockBAProductStock } from '@/lib/stockba';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const results = { updated: 0, skipped: 0, errors: [] as string[] };
  try {
    const products = await prisma.product.findMany({ where: { sourceApi: 'stockba', sourceId: { not: null } }, select: { id: true, sourceId: true, name: true } });
    for (const product of products) {
      if (!product.sourceId) continue;
      try {
        const stockRes = await getStockBAProductStock(Number(product.sourceId));
        let stockQty = 0;
        if (Array.isArray(stockRes.data)) stockQty = stockRes.data.reduce((s: number, l: any) => s + (l.quantity ?? 0), 0);
        else if (typeof stockRes.quantity === 'number') stockQty = stockRes.quantity;
        await prisma.product.update({ where: { id: product.id }, data: { stock: stockQty } });
        results.updated++;
      } catch (err: any) {
        results.errors.push('[' + product.sourceId + '] ' + product.name + ': ' + err.message);
        results.skipped++;
      }
    }
    return NextResponse.json({ ok: true, ...results, total: products.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
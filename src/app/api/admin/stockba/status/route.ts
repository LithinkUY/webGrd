import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const apiKeyConfigured = !!process.env.STOCKBA_API_KEY;
  try {
    const syncedProducts = await prisma.product.count({ where: { sourceApi: 'stockba' } });
    const lastProduct = await prisma.product.findFirst({ where: { sourceApi: 'stockba' }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } });
    return NextResponse.json({ ok: true, apiKeyConfigured, syncedProducts, lastSyncAt: lastProduct?.updatedAt ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, apiKeyConfigured, syncedProducts: 0, lastSyncAt: null, error: err.message });
  }
}

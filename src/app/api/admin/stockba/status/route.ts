import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStockBASummary } from '@/lib/stockba';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [summary, syncedCount, lastSync] = await Promise.allSettled([
        getStockBASummary(),
        prisma.product.count({ where: { sourceApi: 'stockba' } }),
        prisma.product.findFirst({
            where: { sourceApi: 'stockba' },
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
        }),
    ]);

    return NextResponse.json({
        stockba: summary.status === 'fulfilled' ? summary.value : null,
        syncedProducts: syncedCount.status === 'fulfilled' ? syncedCount.value : 0,
        lastSyncAt:
            lastSync.status === 'fulfilled' ? lastSync.value?.updatedAt ?? null : null,
        apiKeyConfigured: !!process.env.STOCKBA_API_KEY,
    });
}

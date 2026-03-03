import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

const SUPER_ADMIN_KEYS = [
  'store_name', 'store_email', 'membership_status', 'membership_expiry',
  'maintenance_mode', 'store_active', 'max_products', 'max_users',
];

// GET /api/admin/super-admin
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: SUPER_ADMIN_KEYS } },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value;

    const [products, orders, users, categories, brands, coupons, pages] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.brand.count(),
      prisma.coupon.count(),
      prisma.page.count(),
    ]);

    return NextResponse.json({
      config: {
        storeName: settingsMap.store_name || '',
        storeEmail: settingsMap.store_email || '',
        membershipStatus: settingsMap.membership_status || 'active',
        membershipExpiry: settingsMap.membership_expiry || '',
        maintenanceMode: settingsMap.maintenance_mode === 'true',
        storeActive: settingsMap.store_active !== 'false',
        maxProducts: settingsMap.max_products || '0',
        maxUsers: settingsMap.max_users || '0',
      },
      stats: { products, orders, users, categories, brands, coupons, pages, dbSize: 'N/A' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/super-admin
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();

    const updates: { key: string; value: string }[] = [
      { key: 'store_name', value: body.storeName || '' },
      { key: 'store_email', value: body.storeEmail || '' },
      { key: 'membership_status', value: body.membershipStatus || 'active' },
      { key: 'membership_expiry', value: body.membershipExpiry || '' },
      { key: 'maintenance_mode', value: String(body.maintenanceMode || false) },
      { key: 'store_active', value: String(body.storeActive !== false) },
      { key: 'max_products', value: String(body.maxProducts || 0) },
      { key: 'max_users', value: String(body.maxUsers || 0) },
    ];

    for (const { key, value } of updates) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

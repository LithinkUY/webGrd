import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// POST /api/admin/api-sources/test-connection
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { sourceType, baseUrl, apiKey, apiSecret } = await req.json();

    if (sourceType === 'woocommerce') {
      if (!baseUrl || !apiKey || !apiSecret) {
        return NextResponse.json({ error: 'URL de tienda, Consumer Key y Consumer Secret son requeridos' }, { status: 400 });
      }

      const storeUrl = baseUrl.replace(/\/+$/, '');
      const url = `${storeUrl}/wp-json/wc/v3/products?per_page=1`;

      const res = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64'),
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return NextResponse.json({
          success: false,
          error: `WooCommerce respondió con HTTP ${res.status}: ${txt.slice(0, 200)}`,
        });
      }

      const products = await res.json();
      const totalProducts = parseInt(res.headers.get('x-wp-total') || '0');
      const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '0');

      return NextResponse.json({
        success: true,
        message: `Conexión exitosa. Se encontraron ${totalProducts} productos en ${totalPages} páginas.`,
        totalProducts,
        sampleProduct: products[0]?.name || null,
      });
    } else {
      // Generic API test
      if (!baseUrl) {
        return NextResponse.json({ error: 'URL es requerida' }, { status: 400 });
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(baseUrl, { headers });
      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `API respondió con HTTP ${res.status}`,
        });
      }

      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data || data.products || [];

      return NextResponse.json({
        success: true,
        message: `Conexión exitosa. Se encontraron ${items.length} items.`,
        totalProducts: items.length,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de conexión';
    return NextResponse.json({ success: false, error: message });
  }
}

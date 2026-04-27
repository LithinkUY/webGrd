import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { findStockBAContactByEmail, createStockBAContact } from '@/lib/stockba';

// Called after an order is placed on the web store.
// Body: { orderId: string }
// This pushes the sale to StockBA for invoicing / stock deduction.

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
        return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            items: { include: { product: true } },
        },
    });

    if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Only process orders that have StockBA products
    const stockbaItems = order.items.filter(
        (item: any) => item.product?.sourceApi === 'stockba' && item.product?.sourceId
    );

    if (stockbaItems.length === 0) {
        return NextResponse.json({
            ok: false,
            message: 'El pedido no contiene productos de StockBA',
        });
    }

    // ── Resolve or create contact ────────────────────────────
    let contactId: number | undefined;
    if (order.user?.email) {
        try {
            const existing = await findStockBAContactByEmail(order.user.email);
            if (existing) {
                contactId = existing.id;
            } else {
                const created = await createStockBAContact({
                    type: 'customer',
                    name: order.user.name || order.user.email,
                    email: order.user.email,
                    mobile: (order.user as any).phone || undefined,
                });
                contactId = created.data?.id || created.id;
            }
        } catch {
            // proceed without contact
        }
    }

    const sellItems = stockbaItems.map((item: any) => ({
        product_id: Number(item.product.sourceId),
        quantity: item.quantity,
        unit_price: item.price,
    }));

    const total = sellItems.reduce(
        (sum: number, i: any) => sum + i.unit_price * i.quantity,
        0
    );

    // POST /sells — placeholder until StockBA opens this endpoint
    // For now we log the intent and return the payload
    const sellPayload = {
        contact_id: contactId,
        items: sellItems,
        total,
        notes: `Pedido web #${order.id.slice(-8)}`,
        payment_method: (order as any).paymentMethod || 'online',
    };

    // TODO: Uncomment when StockBA enables POST /sells
    // const res = await createStockBASell(sellPayload);

    return NextResponse.json({
        ok: true,
        message: 'Venta preparada para StockBA (POST /sells pendiente de habilitación)',
        payload: sellPayload,
    });
}

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import { findStockBAContactByEmail, createStockBAContact } from '@/lib/stockba';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, items: { include: { product: true } } } });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  const stockbaItems = order.items.filter((item: any) => item.product?.sourceApi === 'stockba' && item.product?.sourceId);
  if (stockbaItems.length === 0) return NextResponse.json({ ok: false, message: 'El pedido no contiene productos de StockBA' });
  let contactId: number | undefined;
  if (order.user?.email) {
    try {
      const existing = await findStockBAContactByEmail(order.user.email);
      if (existing) { contactId = existing.id; }
      else { const created = await createStockBAContact({ type: 'customer', name: order.user.name || order.user.email, email: order.user.email }); contactId = created.data?.id || created.id; }
    } catch { /* proceed without contact */ }
  }
  const sellItems = stockbaItems.map((item: any) => ({ product_id: Number(item.product.sourceId), quantity: item.quantity, unit_price: item.price }));
  const total = sellItems.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0);
  return NextResponse.json({ ok: true, message: 'Venta preparada para StockBA', payload: { contact_id: contactId, items: sellItems, total, notes: 'Pedido web #' + order.id.slice(-8) } });
}
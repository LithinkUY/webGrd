import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET público — checkout lo usa para mostrar métodos habilitados
export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'payment_methods' } });
  const methods = setting ? JSON.parse(setting.value) : [
    { id: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦', enabled: true, desc: 'Transferí a cualquiera de nuestras cuentas bancarias' },
    { id: 'mercadopago', label: 'MercadoPago', icon: '💙', enabled: true, desc: 'Pagá con tarjeta, débito o saldo MercadoPago' },
    { id: 'contado', label: 'Contado en local', icon: '💵', enabled: true, desc: 'Pagá en efectivo al retirar en nuestro local' },
  ];
  return NextResponse.json({ methods });
}

// PUT admin — guardar métodos
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { methods } = await req.json();
  await prisma.siteSetting.upsert({
    where: { key: 'payment_methods' },
    create: { key: 'payment_methods', value: JSON.stringify(methods) },
    update: { value: JSON.stringify(methods) },
  });
  return NextResponse.json({ success: true, methods });
}

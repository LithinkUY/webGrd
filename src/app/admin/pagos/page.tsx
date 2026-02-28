import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminPagos() {
  const payments = await prisma.payment.findMany({
    include: { order: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pagos</h1>
        <p className="text-sm text-gray-500 mt-1">Historial de pagos recibidos</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Método</th>
              <th className="p-4 text-right">Monto</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4">ID Externo</th>
              <th className="p-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-mono text-xs text-gray-400">{p.id.slice(0, 8)}</td>
                <td className="p-4">
                  <Link href={`/admin/pedidos/${p.orderId}`} className="text-blue-600 hover:underline font-medium">
                    {p.order.orderNumber}
                  </Link>
                </td>
                <td className="p-4">{p.order.user.name}</td>
                <td className="p-4 capitalize">{p.method}</td>
                <td className="p-4 text-right font-bold">{p.currency} {p.amount.toFixed(2)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[p.status]?.color || 'bg-gray-100'}`}>
                    {statusConfig[p.status]?.label || p.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-gray-400">{p.externalId || '-'}</td>
                <td className="p-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString('es-UY')}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">No hay pagos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

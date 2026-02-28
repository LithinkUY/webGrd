import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminDevoluciones() {
  const returns = await prisma.return.findMany({
    include: { order: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    requested: { label: 'Solicitada', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Aprobada', color: 'bg-blue-100 text-blue-800' },
    rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Devoluciones</h1>
        <p className="text-sm text-gray-500 mt-1">Solicitudes de devolución</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
              <th className="p-4">Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Motivo</th>
              <th className="p-4 text-right">Reembolso</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4">Fecha</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <Link href={`/admin/pedidos/${r.orderId}`} className="text-blue-600 hover:underline font-medium">
                    {r.order.orderNumber}
                  </Link>
                </td>
                <td className="p-4">{r.order.user.name}</td>
                <td className="p-4 text-gray-600 max-w-[300px] truncate">{r.reason}</td>
                <td className="p-4 text-right font-medium">{r.refundAmount ? `USD ${r.refundAmount.toFixed(2)}` : '-'}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[r.status]?.color || 'bg-gray-100'}`}>
                    {statusConfig[r.status]?.label || r.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{new Date(r.createdAt).toLocaleDateString('es-UY')}</td>
                <td className="p-4 text-center">
                  <Link href={`/admin/pedidos/${r.orderId}`} className="text-xs text-blue-600 hover:underline">
                    Ver pedido
                  </Link>
                </td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">No hay devoluciones registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

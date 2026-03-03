import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string; brand?: string; active?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 25;
  const search = params.search || '';
  const categoryId = params.category || '';
  const activeFilter = params.active;

  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { name: { contains: search } },
    { sku: { contains: search } },
    { barcode: { contains: search } },
  ];
  if (categoryId) where.categoryId = categoryId;
  if (activeFilter !== undefined && activeFilter !== '') where.active = activeFilter === 'true';

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: {
        parentId: null,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">{total} productos encontrados</p>
        </div>
        <Link href="/admin/productos/nuevo"
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Buscar</label>
            <input type="text" name="search" defaultValue={search} placeholder="Nombre, SKU o código..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
          </div>
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">Categoría</label>
            <select name="category" defaultValue={categoryId}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              <option value="">Todas</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">Marca</label>
            <select name="brand" defaultValue={params.brand || ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              <option value="">Todas</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select name="active" defaultValue={activeFilter || ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            Filtrar
          </button>
          <Link href="/admin/productos" className="text-sm text-gray-500 hover:text-gray-700 py-2">Limpiar</Link>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
              <th className="p-4">Imagen</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Marca</th>
              <th className="p-4 text-right">Precio</th>
              <th className="p-4 text-right">Costo</th>
              <th className="p-4 text-center">Stock</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const imgs = JSON.parse(p.images || '[]') as string[];
              return (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {imgs[0] ? (
                        <img src={imgs[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="p-4">
                    <Link href={`/admin/productos/${p.id}`} className="font-medium text-gray-900 hover:text-[#e8850c]">
                      {p.name}
                    </Link>
                    <div className="flex gap-1 mt-1">
                      {p.featured && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 rounded">Destacado</span>}
                      {p.isNew && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 rounded">Nuevo</span>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{p.category?.name || '-'}</td>
                  <td className="p-4 text-gray-500">{p.brand?.name || '-'}</td>
                  <td className="p-4 text-right font-medium">USD {p.price.toFixed(2)}</td>
                  <td className="p-4 text-right text-gray-400">{p.cost ? `USD ${p.cost.toFixed(2)}` : '-'}</td>
                  <td className="p-4 text-center">
                    <span className={`font-medium ${p.stock <= (p.minStock || 0) ? 'text-red-600' : p.stock <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link href={`/admin/productos/${p.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={10} className="py-12 text-center text-gray-400">No se encontraron productos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={`/admin/productos?page=${page - 1}&search=${search}&category=${categoryId}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">← Anterior</Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const p = i + Math.max(1, page - 2);
              if (p > pages) return null;
              return (
                <Link key={p} href={`/admin/productos?page=${p}&search=${search}&category=${categoryId}`}
                  className={`px-3 py-1.5 text-sm border rounded-lg ${p === page ? 'bg-[#e8850c] text-white border-[#e8850c]' : 'hover:bg-gray-50'}`}>
                  {p}
                </Link>
              );
            })}
            {page < pages && (
              <Link href={`/admin/productos?page=${page + 1}&search=${search}&category=${categoryId}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Siguiente →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

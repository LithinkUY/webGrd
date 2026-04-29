'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import ProductCard from '@/components/products/ProductCard';

interface Product {
  id: string; name: string; slug: string; price: number;
  comparePrice?: number | null; images: string; sku: string;
  stock: number; isNew: boolean; featured: boolean; description?: string | null;
  category?: { name: string; slug: string } | null;
  brand?: { name: string; slug: string } | null;
}

interface Props {
  products: Product[];
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
  currentCat: string;
  currentBrand: string;
  currentSearch: string;
  currentSort: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  page: number;
  totalPages: number;
  total: number;
  priceMin: number;
  priceMax: number;
}

export default function ProductsClient({
  products, categories, brands,
  currentCat, currentBrand, currentSearch, currentSort,
  currentMinPrice, currentMaxPrice,
  page, totalPages, total, priceMin, priceMax,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [minP, setMinP] = useState(currentMinPrice);
  const [maxP, setMaxP] = useState(currentMaxPrice);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = {
      cat: currentCat, brand: currentBrand, search: currentSearch,
      sort: currentSort, minPrice: currentMinPrice, maxPrice: currentMaxPrice,
      page: String(page),
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '0' && !(k === 'page' && v === '1')) p.set(k, v);
    }
    const q = p.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  function applyPrice() {
    router.push(buildUrl({ minPrice: minP, maxPrice: maxP, page: '1' }));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#e8850c]">Inicio</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Catálogo</span>
        {currentCat && (
          <>
            <span>/</span>
            <span className="text-gray-800 font-medium capitalize">{currentCat.replace(/-/g, ' ')}</span>
          </>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24 space-y-6">

            {/* Categorías */}
            <div>
              <h3 className="font-bold text-gray-800 text-xs mb-2 uppercase tracking-wide">Categorías</h3>
              <ul className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                <li>
                  <Link href={buildUrl({ cat: '', page: '1' })}
                    className={`block text-sm px-2 py-1 rounded transition-colors ${!currentCat ? 'text-[#e8850c] font-semibold bg-orange-50' : 'text-gray-600 hover:text-[#e8850c] hover:bg-orange-50'}`}>
                    Todas
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={buildUrl({ cat: cat.slug, page: '1' })}
                      className={`block text-sm px-2 py-1 rounded transition-colors ${currentCat === cat.slug ? 'text-[#e8850c] font-semibold bg-orange-50' : 'text-gray-600 hover:text-[#e8850c] hover:bg-orange-50'}`}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Marcas */}
            {brands.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 text-xs mb-2 uppercase tracking-wide">Marcas</h3>
                <ul className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
                  <li>
                    <Link href={buildUrl({ brand: '', page: '1' })}
                      className={`block text-sm px-2 py-1 rounded transition-colors ${!currentBrand ? 'text-[#e8850c] font-semibold bg-orange-50' : 'text-gray-600 hover:text-[#e8850c] hover:bg-orange-50'}`}>
                      Todas
                    </Link>
                  </li>
                  {brands.map((b) => (
                    <li key={b.id}>
                      <Link href={buildUrl({ brand: b.slug, page: '1' })}
                        className={`block text-sm px-2 py-1 rounded transition-colors ${currentBrand === b.slug ? 'text-[#e8850c] font-semibold bg-orange-50' : 'text-gray-600 hover:text-[#e8850c] hover:bg-orange-50'}`}>
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Precio */}
            <div>
              <h3 className="font-bold text-gray-800 text-xs mb-3 uppercase tracking-wide">Precio</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">Mínimo</label>
                    <input type="number" value={minP} onChange={e => setMinP(e.target.value)}
                      placeholder={String(priceMin)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">Máximo</label>
                    <input type="number" value={maxP} onChange={e => setMaxP(e.target.value)}
                      placeholder={String(priceMax)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
                  </div>
                </div>
                <button onClick={applyPrice}
                  className="w-full bg-[#e8850c] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#d47a0b] transition-colors">
                  Aplicar
                </button>
                {(currentMinPrice || currentMaxPrice) && (
                  <button onClick={() => { setMinP(''); setMaxP(''); router.push(buildUrl({ minPrice: '', maxPrice: '', page: '1' })); }}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 underline">
                    Limpiar precio
                  </button>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <p className="text-sm text-gray-500 shrink-0">
              <span className="font-semibold text-gray-800">{total}</span> productos
              {totalPages > 1 && <span className="text-gray-400 ml-1">— Pág. {page}/{totalPages}</span>}
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <form onSubmit={(e) => { e.preventDefault(); const val = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value; router.push(buildUrl({ search: val, page: '1' })); }}
                className="flex gap-1">
                <input name="q" defaultValue={currentSearch} placeholder="Buscar..."
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
                <button type="submit" className="bg-[#e8850c] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#d47a0b]">🔍</button>
              </form>
              <select value={currentSort} onChange={(e) => router.push(buildUrl({ sort: e.target.value, page: '1' }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                <option value="">Más recientes</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>

          {/* Filtros activos */}
          {(currentCat || currentBrand || currentSearch || currentMinPrice || currentMaxPrice) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {currentCat && <Link href={buildUrl({ cat: '', page: '1' })} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full hover:bg-orange-200">Categoría: {currentCat.replace(/-/g, ' ')} ✕</Link>}
              {currentBrand && <Link href={buildUrl({ brand: '', page: '1' })} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full hover:bg-orange-200">Marca: {currentBrand.replace(/-/g, ' ')} ✕</Link>}
              {currentSearch && <Link href={buildUrl({ search: '', page: '1' })} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full hover:bg-orange-200">Búsqueda: &quot;{currentSearch}&quot; ✕</Link>}
              {(currentMinPrice || currentMaxPrice) && (
                <button onClick={() => { setMinP(''); setMaxP(''); router.push(buildUrl({ minPrice: '', maxPrice: '', page: '1' })); }}
                  className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full hover:bg-orange-200">
                  Precio: {currentMinPrice ? `$${currentMinPrice}` : '0'} — {currentMaxPrice ? `$${currentMaxPrice}` : 'máx'} ✕
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-semibold text-gray-600">No se encontraron productos</p>
              <Link href="/productos" className="mt-3 inline-block text-sm text-[#e8850c] hover:underline">Ver todos los productos</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 text-gray-600">
                  ← Anterior
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 7) {
                  if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                }
                return (
                  <Link key={p} href={buildUrl({ page: String(p) })}
                    className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${p === page ? 'bg-[#e8850c] text-white border-[#e8850c]' : 'hover:bg-gray-50 text-gray-600'}`}>
                    {p}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 text-gray-600">
                  Siguiente →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/utils';

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string;
  sku: string;
  brand?: { name: string } | null;
  category?: { name: string } | null;
}

function getFirstImage(images: string): string {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : '/placeholder.png';
  } catch {
    return '/placeholder.png';
  }
}

function CarouselSection({ title, products }: { title: string; products: DBProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="mb-6 max-w-[1400px] mx-auto px-4">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center bg-[#3a3a3a] rounded-full overflow-hidden shadow-lg">
          <button
            onClick={() => scroll('left')}
            className="px-4 py-2 text-white hover:bg-[#4a4a4a] transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="px-6 py-2 text-white font-semibold text-[15px] whitespace-nowrap tracking-wide">
            {title}
          </h2>
          <button
            onClick={() => scroll('right')}
            className="px-4 py-2 text-white hover:bg-[#4a4a4a] transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/productos/${p.slug}`}
            className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(16.666%-10px)] min-w-[160px] bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 p-3 flex flex-col"
          >
            <div className="relative aspect-[4/3] mb-2">
              <Image
                src={getFirstImage(p.images)}
                alt={p.name}
                fill
                className="object-contain"
                sizes="200px"
              />
            </div>
            {p.brand && (
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">{p.brand.name}</span>
            )}
            <h3 className="text-[12px] text-gray-800 leading-tight line-clamp-2 min-h-[32px] mb-1 font-medium">
              {p.name}
            </h3>
            <span className="text-[10px] text-gray-300 font-mono mb-1">{p.sku}</span>
            {p.price > 0 && (
              <span className="text-[18px] font-bold text-gray-900 leading-none mb-2">
                {formatPrice(p.price)}
              </span>
            )}
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                En stock
              </span>
              <span className="bg-[#9e9e9e] hover:bg-[#757575] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors">
                Comprar
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function FeaturedProducts() {
  const [sections, setSections] = useState<{ title: string; products: DBProduct[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?limit=60&active=true')
      .then((r) => r.json())
      .then((data) => {
        const products: DBProduct[] = data.products ?? [];
        const map = new Map<string, DBProduct[]>();
        products.forEach((p) => {
          const cat = p.category?.name ?? 'Productos';
          if (!map.has(cat)) map.set(cat, []);
          map.get(cat)!.push(p);
        });
        setSections(
          Array.from(map.entries()).map(([title, prods]) => ({ title, products: prods }))
        );
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#f5f5f5] py-6 px-4 text-gray-400 text-sm text-center">
        Cargando productos…
      </div>
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="bg-[#f5f5f5] py-6">
      {sections.map((s) => (
        <CarouselSection key={s.title} title={s.title} products={s.products} />
      ))}
    </div>
  );
}


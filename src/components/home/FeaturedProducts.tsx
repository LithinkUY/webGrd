'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useCurrency } from '@/store/currency';

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string;
  sku: string;
  brand?: { name: string } | null;
  category?: { name: string; slug: string } | null;
}

function getFirstImage(images: string): string {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : '/placeholder.png';
  } catch {
    return '/placeholder.png';
  }
}

function CarouselSection({
  title,
  categorySlug,
  products,
  hidePrices,
  autoScroll,
}: {
  title: string;
  categorySlug: string;
  products: DBProduct[];
  hidePrices: boolean;
  autoScroll: boolean;
  }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const formatCurrency = useCurrency((s) => s.format);
  const isPaused = useRef(false);

  // Drag-to-scroll
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // Auto-scroll
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isPaused.current || isDragging.current) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: el.clientWidth * 0.5, behavior: 'smooth' });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoScroll]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    dragStartX.current = e.pageX - scrollRef.current.offsetLeft;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const delta = (x - dragStartX.current) * 1.5;
    scrollRef.current.scrollLeft = dragScrollLeft.current - delta;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = '';
    }
  };

  const catHref = `/productos?cat=${encodeURIComponent(categorySlug)}`;

  if (products.length === 0) return null;

  return (
    <section className="mb-6 max-w-[1400px] mx-auto px-4">
      <div className="flex items-center justify-between mb-4 px-1">
        {/* Título + flechas */}
        <div className="flex items-center gap-3">
          <Link
            href={catHref}
            className="text-[15px] font-bold text-gray-800 uppercase tracking-wider hover:text-[#e8850c] transition-colors"
          >
            {title}
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-[#e8850c] hover:text-white text-gray-500 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-[#e8850c] hover:text-white text-gray-500 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ver más */}
        <Link
          href={catHref}
          className="text-[12px] text-[#e8850c] hover:text-[#333] font-medium transition-colors whitespace-nowrap ml-3"
        >
          Ver más →
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { onMouseUp(); isPaused.current = false; }}
        onMouseEnter={() => { isPaused.current = true; }}
      >
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/productos/${p.slug}`}
            draggable={false}
            className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(16.666%-10px)] min-w-[160px] bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 p-3 flex flex-col"
          >
            <div className="relative aspect-[4/3] mb-2 pointer-events-none">
              <Image
                src={getFirstImage(p.images)}
                alt={p.name}
                fill
                className="object-contain"
                sizes="200px"
                draggable={false}
              />
            </div>
            {p.brand && (
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">{p.brand.name}</span>
            )}
            <h3 className="text-[12px] text-gray-800 leading-tight line-clamp-2 min-h-[32px] mb-1 font-medium">
              {p.name}
            </h3>
            <span className="text-[10px] text-gray-300 font-mono mb-1">{p.sku}</span>
            {!hidePrices && p.price > 0 && (
              <span className="text-[18px] font-bold text-gray-900 leading-none mb-2">
                {formatCurrency(p.price)}
              </span>
            )}
            {hidePrices && (
              <span className="text-[11px] text-[#e8850c] font-medium mb-2">Consultar precio</span>
            )}
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                En stock
              </span>
              <span className="bg-[#9e9e9e] hover:bg-[#757575] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors">
                {hidePrices ? 'Consultar' : 'Comprar'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function FeaturedProducts() {
  const [sections, setSections] = useState<{ title: string; slug: string; products: DBProduct[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidePrices, setHidePrices] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/public/settings?keys=hide_prices,home_carousel_auto');
      if (res.ok) {
        const s = await res.json();
        setHidePrices(s.hide_prices === 'true');
        setAutoScroll(s.home_carousel_auto === 'true');
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadSettings();

    // 1. Traer categorías activas
    fetch('/api/categories?active=true')
      .then((r) => r.json())
      .then(async (catData) => {
        const categories: { id: string; name: string; slug: string }[] = Array.isArray(catData) ? catData : (catData.categories ?? []);
        if (categories.length === 0) {
          // fallback: cargar productos planos
          const r = await fetch('/api/products?limit=200&active=true');
          const d = await r.json();
          const products: DBProduct[] = (d.products ?? []).filter((p: DBProduct) => {
            try { return JSON.parse(p.images || '[]').length > 0; } catch { return false; }
          });
          const map = new Map<string, { slug: string; products: DBProduct[] }>();
          products.forEach((p) => {
            const catName = p.category?.name ?? 'Productos';
            const catSlug = p.category?.slug ?? 'productos';
            if (!map.has(catName)) map.set(catName, { slug: catSlug, products: [] });
            map.get(catName)!.products.push(p);
          });
          setSections(Array.from(map.entries()).map(([title, { slug, products: prods }]) => ({ title, slug, products: prods })));
          return;
        }

        // Aplanar: categorías padre + subcategorías (solo las que tienen productos)
        const allCats: { id: string; name: string; slug: string }[] = [];
        for (const cat of categories) {
          const catCount = (cat as any)._count?.products ?? 1;
          if (catCount > 0) allCats.push({ id: cat.id, name: cat.name, slug: cat.slug });
          const children = (cat as any).children ?? [];
          for (const child of children) {
            const childCount = (child as any)._count?.products ?? 1;
            if (childCount > 0) allCats.push({ id: child.id, name: child.name, slug: child.slug });
          }
        }

        // 2. Para cada categoría cargar sus productos (máx 24)
        const results = await Promise.all(
          allCats.map(async (cat) => {
            try {
              const r = await fetch(`/api/products?category=${encodeURIComponent(cat.slug)}&limit=24&active=true`);
              const d = await r.json();
              const prods: DBProduct[] = (d.products ?? []).filter((p: DBProduct) => {
                try { return JSON.parse(p.images || '[]').length > 0; } catch { return false; }
              });
              return { title: cat.name, slug: cat.slug, products: prods };
            } catch {
              return { title: cat.name, slug: cat.slug, products: [] };
            }
          })
        );
        setSections(results.filter((s) => s.products.length > 0));
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [loadSettings]);

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
        <CarouselSection
          key={s.title}
          title={s.title}
          categorySlug={s.slug}
          products={s.products}
          hidePrices={hidePrices}
          autoScroll={autoScroll}
        />
      ))}
    </div>
  );
}


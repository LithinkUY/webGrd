'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export default function BrandsBar() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch('/api/public/brands')
      .then((r) => r.json())
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]));
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="py-5 bg-white border-y border-[#ddd]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider">
            Marcas y Representaciones
          </h3>
          <Link href="/productos" className="text-[12px] text-[#e8850c] hover:text-[#333] transition-colors">
            ver todas →
          </Link>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/productos?brand=${encodeURIComponent(brand.slug)}`}
              className="flex flex-col items-center gap-1 group"
              title={brand.name}
            >
              {brand.logo ? (
                <div className="relative h-8 w-20">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain grayscale group-hover:grayscale-0 transition-all duration-200"
                    sizes="80px"
                  />
                </div>
              ) : (
                <span className="text-[#666] group-hover:text-[#e8850c] font-semibold text-[13px] transition-colors">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

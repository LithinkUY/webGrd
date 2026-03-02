'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Product {
  sku: string;
  name: string;
  price: number;
  image: string;
  brand: string;
}

const sections: { title: string; products: Product[] }[] = [
  {
    title: 'Nuevo arribo de ASRock !',
    products: [
      { sku: 'MON340', name: 'Monitor ASRock Phantom PG27QFT2A 27" IPS QHD 180Hz', price: 99, image: '/products/productos2_54805.jpg', brand: 'ASRock' },
      { sku: 'MON341', name: 'Monitor ASRock Phantom PG27FFT2A 27" IPS FHD 180Hz', price: 112, image: '/products/productos2_54808.jpg', brand: 'ASRock' },
      { sku: 'MOT179', name: 'Mother ASRock B650M-HDV/M.2 AM5 DDR5', price: 171, image: '/products/productos2_52202.jpg', brand: 'ASRock' },
      { sku: 'MOT180', name: 'Mother ASRock B650M Pro RS WiFi AM5 DDR5', price: 194, image: '/products/productos2_52251.jpg', brand: 'ASRock' },
      { sku: 'MOT200', name: 'Mother ASRock B850M Pro RS WiFi AM5 DDR5', price: 159, image: '/products/productos2_54741.jpg', brand: 'ASRock' },
      { sku: 'TAR265', name: 'Tarjeta de Video ASRock AMD Radeon RX 7600 Challenger 8GB', price: 289, image: '/products/productos2_52341.jpg', brand: 'ASRock' },
      { sku: 'MOT171', name: 'Mother ASRock B760M Pro RS/D4 LGA1700 DDR4', price: 119, image: '/products/productos2_52210.jpg', brand: 'ASRock' },
      { sku: 'MOT195', name: 'Mother ASRock A620M-HDV/M.2 AM5 DDR5', price: 89, image: '/products/productos2_54677.jpg', brand: 'ASRock' },
      { sku: 'MOT197', name: 'Mother ASRock B650 LiveMixer WiFi AM5 DDR5', price: 219, image: '/products/productos2_54694.jpg', brand: 'ASRock' },
      { sku: 'MOT186', name: 'Mother ASRock B660M-HDV LGA1700 DDR4', price: 99, image: '/products/productos2_52294.jpg', brand: 'ASRock' },
      { sku: 'MOT178', name: 'Mother ASRock A520M-HVS AM4 DDR4', price: 69, image: '/products/productos2_52239.jpg', brand: 'ASRock' },
    ],
  },
  {
    title: 'Nuevo arribo de Lexar',
    products: [
      { sku: 'DIS419', name: 'SSD Lexar NM790 1TB M.2 NVMe PCIe 4.0', price: 79, image: '/products/productos2_51936.jpg', brand: 'Lexar' },
      { sku: 'LEC90', name: 'Lector Lexar Multi-Card 2-in-1 USB 3.1', price: 15, image: '/products/productos2_55626.jpg', brand: 'Lexar' },
      { sku: 'MEM457', name: 'Memoria Lexar ARES DDR5 32GB (2x16) 6400MHz RGB', price: 99, image: '/products/productos2_51825.jpg', brand: 'Lexar' },
      { sku: 'MEM469', name: 'Memoria Lexar ARES DDR5 32GB (2x16) 6000MHz', price: 79, image: '/products/productos2_52771.jpg', brand: 'Lexar' },
      { sku: 'PEN219', name: 'Pendrive Lexar JumpDrive M900 128GB USB 3.2', price: 19, image: '/products/productos2_52760.jpg', brand: 'Lexar' },
      { sku: 'LEC87', name: 'Lector Lexar Multi-Card 3-in-1 USB 3.2 Type-C', price: 19, image: '/products/productos2_52762.jpg', brand: 'Lexar' },
      { sku: 'MEM468', name: 'Memoria Lexar THOR DDR4 32GB (2x16) 3600MHz', price: 55, image: '/products/productos2_52770.jpg', brand: 'Lexar' },
      { sku: 'MEM470', name: 'Memoria Lexar ARES DDR5 64GB (2x32) 6400MHz RGB', price: 179, image: '/products/productos2_52772.jpg', brand: 'Lexar' },
    ],
  },
  {
    title: 'Toda la linea be quiet !',
    products: [
      { sku: 'GAB180', name: 'Gabinete be quiet! Pure Base 500DX Black', price: 119, image: '/products/productos2_53730.jpg', brand: 'be quiet!' },
      { sku: 'FUE262', name: 'Fuente be quiet! Pure Power 12 M 750W 80+ Gold', price: 99, image: '/products/productos2_53773.jpg', brand: 'be quiet!' },
      { sku: 'COO435', name: 'Cooler be quiet! Pure Rock 2 Black', price: 29, image: '/products/productos2_53794.jpg', brand: 'be quiet!' },
      { sku: 'COO440', name: 'Cooler be quiet! Dark Rock Pro 5', price: 89, image: '/products/productos2_53799.jpg', brand: 'be quiet!' },
      { sku: 'COO441', name: 'Cooler be quiet! Pure Rock Slim 2', price: 44, image: '/products/productos2_53803.jpg', brand: 'be quiet!' },
      { sku: 'FUE265', name: 'Fuente be quiet! Straight Power 12 1000W 80+ Platinum', price: 169, image: '/products/productos2_53807.jpg', brand: 'be quiet!' },
      { sku: 'GAB185', name: 'Gabinete be quiet! Shadow Base 800 DX Black', price: 149, image: '/products/productos2_53808.jpg', brand: 'be quiet!' },
      { sku: 'COO442', name: 'Cooler Fan be quiet! Light Wings 120mm PWM ARGB', price: 25, image: '/products/productos2_53811.jpg', brand: 'be quiet!' },
    ],
  },
  {
    title: 'Notebooks GAMER',
    products: [
      { sku: 'NOT3125', name: 'Notebook Lenovo IdeaPad Gaming 3 15.6" Ryzen 5 RTX 3050', price: 899, image: '/products/productos2_53084.jpg', brand: 'Lenovo' },
      { sku: 'NOT3236', name: 'Notebook ASUS TUF Gaming A15 15.6" Ryzen 7 RTX 4060', price: 1099, image: '/products/productos2_53357.jpg', brand: 'ASUS' },
      { sku: 'NOT3228', name: 'Notebook MSI Raider GE78 HX 17" i9 RTX 4090', price: 2499, image: '/products/productos2_53962.jpg', brand: 'MSI' },
      { sku: 'NOT3129', name: 'Notebook ASUS ROG Strix G16 i9 RTX 4070', price: 2799, image: '/products/productos2_53968.jpg', brand: 'ASUS' },
      { sku: 'NOT3346', name: 'Notebook Lenovo LOQ 15.6" Ryzen 7 RTX 4060', price: 1599, image: '/products/productos2_55953.jpg', brand: 'Lenovo' },
      { sku: 'NOT3343', name: 'Notebook ASUS TUF Gaming A16 Ryzen 9 RTX 4070', price: 1999, image: '/products/productos2_55659.jpg', brand: 'ASUS' },
    ],
  },
];

function CarouselSection({ title, products }: { title: string; products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="mb-6 max-w-[1400px] mx-auto px-4">
      {/* Título estilo CDR — pill oscuro con flechas */}
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

      {/* Carrusel */}
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {products.map((p) => (
          <div key={p.sku} className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(16.666%-10px)] min-w-[160px] bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 p-3 flex flex-col">
            <div className="relative aspect-[4/3] mb-2">
              <Image src={p.image} alt={p.name} fill className="object-contain" sizes="200px" />
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">{p.brand}</span>
            <h3 className="text-[12px] text-gray-800 leading-tight line-clamp-2 min-h-[32px] mb-1 font-medium">{p.name}</h3>
            <span className="text-[10px] text-gray-300 font-mono mb-1">{p.sku}</span>
            {p.price > 0 && (
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[11px] text-gray-400">USD</span>
                <span className="text-[20px] font-bold text-gray-900 leading-none">{p.price}</span>
              </div>
            )}
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">En stock</span>
              <button className="bg-[#9e9e9e] hover:bg-[#757575] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors">
                Comprar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FeaturedProducts() {
  return (
    <div className="bg-[#f5f5f5] py-6">
      {sections.map((s) => (
        <CarouselSection key={s.title} title={s.title} products={s.products} />
      ))}
    </div>
  );
}

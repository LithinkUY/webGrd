'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useCart, CartProduct } from '@/store/cart';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

// Module-level cache so all ProductCards share one fetch
let _settingsCache: { hidePrices: boolean; whatsapp: string } | null = null;
let _settingsPromise: Promise<{ hidePrices: boolean; whatsapp: string }> | null = null;

function fetchPublicSettings() {
  if (_settingsCache) return Promise.resolve(_settingsCache);
  if (!_settingsPromise) {
    _settingsPromise = fetch('/api/public/settings?keys=hide_prices,site_whatsapp')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        _settingsCache = {
          hidePrices: data.hide_prices === 'true',
          whatsapp: data.site_whatsapp ? data.site_whatsapp.replace(/\D/g, '') : '',
        };
        return _settingsCache!;
      })
      .catch(() => {
        _settingsCache = { hidePrices: false, whatsapp: '' };
        return _settingsCache!;
      });
  }
  return _settingsPromise;
}

function usePublicSettings() {
  const [settings, setSettings] = useState<{ hidePrices: boolean; whatsapp: string }>({ hidePrices: false, whatsapp: '' });
  useEffect(() => { fetchPublicSettings().then(setSettings); }, []);
  return settings;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    images: string;
    sku: string;
    stock: number;
    isNew: boolean;
    featured: boolean;
    description?: string | null;
    category?: { name: string } | null;
    brand?: { name: string } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { hidePrices, whatsapp } = usePublicSettings();

  let images: string[] = [];
  try { images = JSON.parse(product.images || '[]'); } catch {}
  const mainImage = images[0] || null;

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: mainImage || '',
      sku: product.sku,
      stock: product.stock,
    };
    for (let i = 0; i < qty; i++) addItem(cartProduct);
    toast.success(`${qty > 1 ? qty + 'x ' : ''}Agregado al carrito`);
    setQty(1);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: mainImage || '',
      sku: product.sku,
      stock: product.stock,
    };
    for (let i = 0; i < qty; i++) addItem(cartProduct);
    router.push('/checkout');
  };

  const incQty = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setQty(q => Math.min(q + 1, product.stock || 99)); };
  const decQty = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setQty(q => Math.max(1, q - 1)); };

  return (
    <div
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagen */}
      <div className="relative aspect-square bg-gray-50 p-3 flex items-center justify-center overflow-hidden">
        {/* Badges */}
        {product.isNew && (
          <span className="absolute top-2 left-2 z-10 bg-[#44aa44] text-white text-[9px] font-bold px-2 py-0.5 rounded">NUEVO</span>
        )}
        {discount > 0 && (
          <span className="absolute top-2 right-8 z-10 bg-[#fe3439] text-white text-[9px] font-bold px-2 py-0.5 rounded">-{discount}%</span>
        )}

        {/* Favorito */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorite(f => !f); }}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
        >
          {isFavorite
            ? <HeartSolid className="w-4 h-4 text-red-500" />
            : <HeartIcon className="w-4 h-4 text-gray-400" />}
        </button>

        <Link href={`/productos/${product.slug}`} className="block w-full h-full absolute inset-0">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-contain p-5 transition-transform duration-300"
              style={{ transform: hovered ? 'scale(1.07)' : 'scale(1)' }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-200 text-5xl select-none">📦</div>
          )}
        </Link>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 border-t border-gray-100">
        {product.brand && (
          <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{product.brand.name}</span>
        )}
        <Link href={`/productos/${product.slug}`}>
          <h3 className="text-[12px] text-gray-800 leading-snug line-clamp-2 min-h-[2.5rem] font-semibold hover:text-[#e8850c] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2 space-y-2">
          {/* Precio */}
          <div>
            {!hidePrices && product.comparePrice && product.comparePrice > product.price && (
              <p className="text-[10px] text-gray-400 line-through">USD {Math.round(product.comparePrice)}</p>
            )}
            {hidePrices ? (
              <p className="text-[12px] text-[#25D366] font-semibold">Consultar precio</p>
            ) : product.price > 0 ? (
              <p className="text-gray-900 leading-none">
                <span className="text-[11px] font-normal text-gray-500">USD </span>
                <span className="text-[22px] font-bold">{Math.round(product.price)}</span>
              </p>
            ) : (
              <p className="text-[12px] text-gray-400 italic">
                {session ? 'Consultar precio' : 'Regístrate para ver precios'}
              </p>
            )}
          </div>

          {/* Botones */}
          {hidePrices ? (
            /* Modo "ocultar precios": botón WhatsApp Consultar */
            <a
              href={whatsapp
                ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, quisiera consultar el precio de: ${product.name} (SKU: ${product.sku})`)}`
                : '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[11px] font-bold py-2 rounded transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Consultar
            </a>
          ) : product.stock > 0 && product.price > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                {/* Qty */}
                <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                  <button onClick={decQty} className="w-6 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm">−</button>
                  <span className="w-6 text-center text-[12px] font-medium">{qty}</span>
                  <button onClick={incQty} className="w-6 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm">+</button>
                </div>
                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center w-8 h-7 border border-[#e8850c] text-[#e8850c] rounded hover:bg-[#e8850c] hover:text-white transition-colors"
                  title="Agregar al carrito"
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleBuy}
                className="w-full bg-[#9e9e9e] hover:bg-[#757575] text-white text-[11px] font-bold py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors"
              >
                🛒 Comprar
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-red-500 font-medium">Sin stock</p>
          )}
        </div>

        {/* SKU */}
        <p className="mt-2 text-center text-[9px] text-gray-300 uppercase tracking-wide font-mono">{product.sku}</p>
      </div>
    </div>
  );
}

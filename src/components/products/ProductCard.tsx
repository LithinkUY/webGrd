'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useCart, CartProduct } from '@/store/cart';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useState } from 'react';

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

        <Link href={`/productos/${product.slug}`} className="block w-full h-full">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-contain p-2 transition-transform duration-300"
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
            {product.comparePrice && product.comparePrice > product.price && (
              <p className="text-[10px] text-gray-400 line-through">USD {Math.round(product.comparePrice)}</p>
            )}
            {product.price > 0 ? (
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
          {product.stock > 0 && product.price > 0 ? (
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

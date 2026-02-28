'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart, CartProduct } from '@/store/cart';
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

  const incQty = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setQty(q => Math.min(q + 1, product.stock || 99)); };
  const decQty = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setQty(q => Math.max(1, q - 1)); };

  return (
    <div className="group bg-white border border-[#e0e0e0] hover:border-[#e8850c] hover:shadow-lg transition-all duration-200 flex flex-col rounded-sm">
      {/* Imagen */}
      <div className="relative">
        {/* Badges */}
        {product.isNew && (
          <span className="absolute top-2 left-2 z-10 bg-[#44aa44] text-white text-[9px] font-bold px-2 py-0.5 rounded">
            NUEVO
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-2 right-2 z-10 bg-[#fe3439] text-white text-[9px] font-bold px-2 py-0.5 rounded">
            -{discount}%
          </span>
        )}

        <Link href={`/productos/${product.slug}`} className="block">
          <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden p-3">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-300 text-5xl select-none">📦</div>
            )}
          </div>
        </Link>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 text-center border-t border-gray-100">
        <Link href={`/productos/${product.slug}`} className="block">
          <h3 className="text-[12px] text-[#333] leading-snug line-clamp-2 min-h-[2.5rem] font-semibold group-hover:text-[#e8850c] transition-colors mb-1">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-[10px] text-[#999] line-clamp-1 mb-2">{product.description}</p>
        )}

        <div className="mt-auto pt-2 space-y-2">
          {/* Precio */}
          <div>
            {product.comparePrice && product.comparePrice > product.price && (
              <p className="text-[10px] text-[#bbb] line-through">USD {Math.round(product.comparePrice)}</p>
            )}
            {product.price > 0 ? (
              <p className="text-[#333] leading-none">
                <span className="text-[11px] font-normal">USD </span>
                <span className="text-[22px] font-bold">{Math.round(product.price)}</span>
              </p>
            ) : (
              <p className="text-[#999] text-sm italic">Consultar precio</p>
            )}
          </div>

          {/* Qty + Comprar */}
          {product.stock > 0 && product.price > 0 ? (
            <div className="flex items-center justify-center gap-2">
              {/* Selector de cantidad */}
              <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                <button
                  onClick={decQty}
                  className="w-6 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm leading-none"
                >−</button>
                <span className="w-7 text-center text-[12px] font-medium">{qty}</span>
                <div className="flex flex-col">
                  <button
                    onClick={incQty}
                    className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:bg-gray-100 text-[9px] leading-none border-b border-gray-200"
                  >▲</button>
                  <button
                    onClick={decQty}
                    className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:bg-gray-100 text-[9px] leading-none"
                  >▼</button>
                </div>
              </div>
              {/* Botón comprar */}
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-1.5 bg-[#e8850c] text-white text-[11px] font-bold py-1.5 px-4 rounded hover:bg-[#d47a0b] transition-colors"
              >
                <ShoppingCartIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Comprar</span>
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-red-500 font-medium">Sin stock</p>
          )}
        </div>

        {/* SKU */}
        <p className="mt-2 text-[9px] text-[#ccc] uppercase tracking-wide">{product.sku}</p>
      </div>
    </div>
  );
}

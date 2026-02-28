'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  sku: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  images: string;
  featured: boolean;
  isNew: boolean;
  specs: string | null;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    fetch('/api/products/' + slug)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Producto no encontrado</h1>
        <Link href="/productos" className="text-blue-600 hover:underline">Volver a productos</Link>
      </div>
    );
  }

  const images: string[] = JSON.parse(product.images || '[]');
  if (images.length === 0) images.push('/placeholder-product.svg');
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  const specs: Record<string, string> = product.specs ? JSON.parse(product.specs) : {};

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: images[0],
      sku: product.sku,
      stock: product.stock,
    }, qty);
    toast.success('Agregado al carrito');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600">Inicio</Link>
        <span>/</span>
        <Link href="/productos" className="hover:text-blue-600">Productos</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={'/productos?category=' + product.category.slug} className="hover:text-blue-600">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="bg-white rounded-xl border p-6 mb-4">
            <div className="relative aspect-square">
              <Image
                src={images[selectedImg]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.isNew && (
                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">NUEVO</span>
              )}
              {discount > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">-{discount}%</span>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={'w-16 h-16 rounded-lg border-2 overflow-hidden ' + (i === selectedImg ? 'border-blue-600' : 'border-gray-200')}>
                  <Image src={img} alt="" width={64} height={64} className="object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{product.brand.name}</p>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
          <p className="text-sm text-gray-400 mb-4">SKU: {product.sku}</p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-extrabold text-blue-900">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
            )}
            {discount > 0 && (
              <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">Ahorro {discount}%</span>
            )}
          </div>

          {product.shortDesc && <p className="text-gray-600 mb-6">{product.shortDesc}</p>}

          <div className="flex items-center gap-2 mb-6">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                En stock ({product.stock} disponibles)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                Sin stock
              </span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">-</button>
                <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">+</button>
              </div>
              <button onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                <ShoppingCartIcon className="h-5 w-5" />
                Agregar al Carrito
              </button>
            </div>
          )}

          {Object.keys(specs).length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-3">Especificaciones</h3>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(specs).map(([key, val]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 text-gray-500 w-1/3">{key}</td>
                      <td className="py-2 font-medium text-gray-800">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {product.description && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-bold text-gray-800 mb-3">Descripcion</h3>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

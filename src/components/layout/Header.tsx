'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCart } from '@/store/cart';
import SearchBar from './SearchBar';

const searchCategories = [
  { name: 'Audio Imagen', slug: 'audio-imagen' },
  { name: 'Gabinetes Accesorios', slug: 'gabinetes-accesorios' },
  { name: 'Notebook PC Tablet', slug: 'notebooks-pc-tablet' },
  { name: 'Portabilidad', slug: 'portabilidad' },
  { name: 'Telefonía Smartwatch', slug: 'telefonia-smartwatch' },
  { name: 'Hardware Accesorios', slug: 'hardware-accesorios' },
  { name: 'Gaming', slug: 'gaming' },
  { name: 'Conectividad', slug: 'conectividad' },
  { name: 'Impresión', slug: 'impresion' },
  { name: 'Energía', slug: 'energia' },
  { name: 'Hogar', slug: 'hogar' },
  { name: 'Outlet', slug: 'outlet' },
  { name: 'Arribados', slug: 'arribados' },
];

export default function Header() {
  const { data: session } = useSession();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCart((s) => s.totalItems);
  const totalPrice = useCart((s) => s.totalPrice);

  // Settings de apariencia
  const [logoText, setLogoText] = useState('ImpoTech');
  const [logoAccent, setLogoAccent] = useState('Impo');
  const [logoColor, setLogoColor] = useState('#e8850c');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [colorSecondary, setColorSecondary] = useState('#333333');

  useEffect(() => {
    setMounted(true);
    // Cargar settings de apariencia
    fetch('/api/public/settings?keys=logo_text,logo_accent,logo_color,logo_image_url,color_secondary')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.logo_text) setLogoText(data.logo_text);
        if (data.logo_accent) setLogoAccent(data.logo_accent);
        if (data.logo_color) setLogoColor(data.logo_color);
        if (data.logo_image_url) setLogoImageUrl(data.logo_image_url);
        if (data.color_secondary) setColorSecondary(data.color_secondary);
      })
      .catch(() => {});
  }, []);

  // Evitar mismatch de hydration: en SSR siempre mostramos 0
  const cartCount = mounted ? totalItems() : 0;
  const cartTotal = mounted ? totalPrice() : 0;

  return (
    <header className="sticky top-0 z-50">
      {/* Main header bar */}
      <div style={{ backgroundColor: colorSecondary }}>
        <div className="container mx-auto px-4 flex items-center justify-between h-[56px] gap-4">
          {/* Logo dinámico */}
          <Link href="/" className="flex-shrink-0">
            {logoImageUrl ? (
              <Image
                src={logoImageUrl}
                alt={logoText}
                width={140}
                height={40}
                className="object-contain max-h-[40px] w-auto"
                unoptimized
              />
            ) : (
              <div className="text-2xl font-black text-white tracking-tight leading-none" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                <span style={{ color: logoColor }}>{logoAccent}</span>
                {logoText.slice(logoAccent.length)}
              </div>
            )}
          </Link>

          {/* AJAX Search bar — Mercado Libre style */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar />
          </div>

          {/* Right side: user info + cart */}
          <div className="hidden md:flex items-center gap-5">
            {/* Favorites */}
            <Link href="/favoritos" className="text-gray-400 hover:text-white transition-colors">
              <span className="text-lg">☆</span>
            </Link>

            {/* User area */}
            <div className="flex items-center gap-2 text-[13px]">
              <UserIcon className="h-5 w-5 text-white" />
              {session ? (
                <div className="flex items-center gap-2">
                  <Link href="/mi-cuenta" className="text-white font-medium hover:text-[#e8850c] transition-colors">{session.user.name}</Link>
                  {session.user.role === 'admin' && (
                    <Link href="/admin" className="text-[#e8850c] hover:text-white text-[11px]">Admin</Link>
                  )}
                  <button onClick={() => signOut()} className="text-gray-400 hover:text-white text-[11px]">Salir</button>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-300">
                  <Link href="/auth/login" className="hover:text-white transition-colors">Ingresar</Link>
                  <span className="text-gray-600">|</span>
                  <Link href="/auth/register" className="hover:text-white transition-colors">Registro</Link>
                </div>
              )}
            </div>

            {/* Cart — green badge + USD total */}
            <Link href="/carrito" className="flex items-center gap-2 text-white">
              <div className="relative">
                <ShoppingCartIcon className="h-6 w-6" />
                <span className="absolute -top-2 -right-2.5 bg-[#1a8a7d] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              </div>
              <span className="text-[13px] font-bold text-white ml-1">USD {cartTotal.toFixed(2)}</span>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white p-2">
            {mobileMenu ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden bg-[#222] border-t border-[#333] max-h-[80vh] overflow-y-auto">
          <div className="p-4 flex items-center gap-2 text-[13px] text-gray-400 border-b border-[#333]">
            <UserIcon className="h-4 w-4" />
            {session ? (
              <div className="flex items-center gap-2">
                <span className="text-white">{session.user.name}</span>
                <button onClick={() => signOut()} className="text-gray-500 hover:text-white">Salir</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="hover:text-white" onClick={() => setMobileMenu(false)}>Ingresar</Link>
                <span>|</span>
                <Link href="/auth/register" className="hover:text-white" onClick={() => setMobileMenu(false)}>Registro</Link>
              </div>
            )}
          </div>
          <div className="p-4 border-b border-[#333]">
            <SearchBar />
          </div>
          <div className="p-4 flex items-center justify-between border-b border-[#333]">
            <Link href="/carrito" className="flex items-center gap-2 text-white" onClick={() => setMobileMenu(false)}>
              <ShoppingCartIcon className="h-5 w-5" />
              <span className="text-sm">Mi compra</span>
              <span className="bg-[#e8850c] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
              <span className="font-bold">USD {cartTotal.toFixed(0)}</span>
            </Link>
          </div>
          <ul className="pb-4">
            {searchCategories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/productos?category=${cat.slug}`}
                  className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-[#333] text-sm"
                  onClick={() => setMobileMenu(false)}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

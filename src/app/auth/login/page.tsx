'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { ...form, redirect: false });
    setLoading(false);

    if (res?.error) {
      toast.error('Email o contraseña incorrectos');
    } else {
      toast.success('Bienvenido!');
      // Verificar sesión para redirigir según el rol
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (session?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/mi-cuenta');
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tenés cuenta? <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">Registrate</Link>
        </p>
      </div>
    </div>
  );
}

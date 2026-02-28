'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface PaymentConfig {
  id: string;
  provider: string;
  publicKey: string | null;
  accessToken: string | null;
  webhookSecret: string | null;
  sandbox: boolean;
  active: boolean;
}

export default function AdminMercadoPago() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    publicKey: '',
    accessToken: '',
    webhookSecret: '',
    sandbox: true,
    active: false,
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-config/mercadopago');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setForm({
          publicKey: data.publicKey || '',
          accessToken: data.accessToken ? '••••••••' : '',
          webhookSecret: data.webhookSecret ? '••••••••' : '',
          sandbox: data.sandbox,
          active: data.active,
        });
      }
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: Record<string, unknown> = {
        provider: 'mercadopago',
        publicKey: form.publicKey,
        sandbox: form.sandbox,
        active: form.active,
      };
      // Solo enviar tokens si fueron modificados
      if (!form.accessToken.includes('•')) body.accessToken = form.accessToken;
      if (!form.webhookSecret.includes('•')) body.webhookSecret = form.webhookSecret;

      const res = await fetch('/api/admin/payment-config/mercadopago', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Configuración guardada');
      load();
    } catch {
      toast.error('Error al guardar configuración');
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">MercadoPago</h1>
        <p className="text-sm text-gray-500 mt-1">Configuración del gateway de pago MercadoPago</p>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${form.active ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <span className={`w-3 h-3 rounded-full ${form.active ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
        <div>
          <p className={`font-medium text-sm ${form.active ? 'text-green-800' : 'text-yellow-800'}`}>
            {form.active ? 'MercadoPago activo' : 'MercadoPago desactivado'}
          </p>
          <p className="text-xs text-gray-500">
            {form.sandbox ? 'Modo sandbox (pruebas)' : 'Modo producción'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Public Key</label>
          <input type="text" value={form.publicKey} onChange={e => setForm(f => ({ ...f, publicKey: e.target.value }))}
            className={inputClass} placeholder="APP_USR-..." />
          <p className="text-xs text-gray-400 mt-1">Clave pública de MercadoPago</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Access Token</label>
          <input type="password" value={form.accessToken}
            onFocus={e => { if (e.target.value.includes('•')) setForm(f => ({ ...f, accessToken: '' })); }}
            onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
            className={inputClass} placeholder="APP_USR-..." />
          <p className="text-xs text-gray-400 mt-1">Token de acceso (se almacena encriptado)</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Webhook Secret</label>
          <input type="password" value={form.webhookSecret}
            onFocus={e => { if (e.target.value.includes('•')) setForm(f => ({ ...f, webhookSecret: '' })); }}
            onChange={e => setForm(f => ({ ...f, webhookSecret: e.target.value }))}
            className={inputClass} placeholder="Secret para validar webhooks" />
        </div>

        <div className="flex gap-6 pt-4 border-t">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.sandbox} onChange={e => setForm(f => ({ ...f, sandbox: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#e8850c] focus:ring-[#e8850c]" />
            <div>
              <span className="text-sm font-medium">Modo Sandbox</span>
              <p className="text-xs text-gray-400">Usar credenciales de prueba</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <div>
              <span className="text-sm font-medium">Activar MercadoPago</span>
              <p className="text-xs text-gray-400">Habilitar como método de pago</p>
            </div>
          </label>
        </div>

        <div className="pt-4">
          <button type="submit"
            className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
            Guardar Configuración
          </button>
        </div>
      </form>

      {/* Info de integración */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h2 className="font-bold text-sm text-gray-800 mb-4">Información de Integración</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-500">Webhook URL</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/mercadopago</code>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-500">Redirect URL</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/checkout/resultado</code>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Moneda</span>
            <span className="font-medium">USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

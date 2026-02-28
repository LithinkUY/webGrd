'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Setting { key: string; value: string }

const defaultSettings: { key: string; label: string; type: string; group: string; placeholder?: string }[] = [
  { key: 'site_name', label: 'Nombre del sitio', type: 'text', group: 'general', placeholder: 'ImpoTech' },
  { key: 'site_description', label: 'Descripción', type: 'text', group: 'general', placeholder: 'Tu tienda de tecnología' },
  { key: 'site_email', label: 'Email de contacto', type: 'email', group: 'general', placeholder: 'info@impotech.com' },
  { key: 'site_phone', label: 'Teléfono', type: 'text', group: 'general', placeholder: '+598 2XXX XXXX' },
  { key: 'site_address', label: 'Dirección', type: 'text', group: 'general', placeholder: 'Montevideo, Uruguay' },
  { key: 'site_whatsapp', label: 'WhatsApp', type: 'text', group: 'general', placeholder: '+59899123456' },
  { key: 'currency', label: 'Moneda', type: 'text', group: 'comercio', placeholder: 'USD' },
  { key: 'tax_rate', label: 'IVA (%)', type: 'number', group: 'comercio', placeholder: '22' },
  { key: 'shipping_cost', label: 'Costo envío estándar', type: 'number', group: 'comercio', placeholder: '5' },
  { key: 'free_shipping_min', label: 'Envío gratis desde (USD)', type: 'number', group: 'comercio', placeholder: '100' },
  { key: 'meta_title', label: 'Meta Title', type: 'text', group: 'seo', placeholder: 'ImpoTech - Tecnología al mejor precio' },
  { key: 'meta_description', label: 'Meta Description', type: 'textarea', group: 'seo', placeholder: 'Tienda de tecnología con los mejores precios...' },
  { key: 'facebook_url', label: 'Facebook', type: 'text', group: 'social', placeholder: 'https://facebook.com/impotech' },
  { key: 'instagram_url', label: 'Instagram', type: 'text', group: 'social', placeholder: 'https://instagram.com/impotech' },
  { key: 'twitter_url', label: 'Twitter / X', type: 'text', group: 'social', placeholder: 'https://x.com/impotech' },
];

export default function AdminConfiguracion() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data: Setting[] = await res.json();
        const map: Record<string, string> = {};
        for (const s of data) map[s.key] = s.value;
        setSettings(map);
      }
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const groups = [
    { id: 'general', label: '🏢 General', desc: 'Información básica del sitio' },
    { id: 'comercio', label: '💰 Comercio', desc: 'Moneda, impuestos y envíos' },
    { id: 'seo', label: '🔍 SEO', desc: 'Optimización para buscadores' },
    { id: 'social', label: '📱 Redes Sociales', desc: 'Enlaces a redes' },
  ];

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Ajustes generales del sitio</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {groups.map(group => (
          <div key={group.id} className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-1">{group.label}</h2>
            <p className="text-xs text-gray-400 mb-4">{group.desc}</p>
            <div className="space-y-4">
              {defaultSettings.filter(s => s.group === group.id).map(s => (
                <div key={s.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{s.label}</label>
                  {s.type === 'textarea' ? (
                    <textarea value={settings[s.key] || ''} onChange={e => setSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                      className={inputClass} rows={3} placeholder={s.placeholder} />
                  ) : (
                    <input type={s.type} value={settings[s.key] || ''} onChange={e => setSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                      className={inputClass} placeholder={s.placeholder} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}

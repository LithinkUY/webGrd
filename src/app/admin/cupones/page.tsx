'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  createdAt: string;
}

const emptyForm = {
  code: '', description: '', type: 'percentage', value: '',
  minPurchase: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '', active: true,
};

export default function AdminCupones() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/coupons?${params}`);
    const data = await res.json();
    setCoupons(data.coupons || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const val = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm({ ...form, [target.name]: val });
  };

  const openEdit = (c: Coupon) => {
    setEditing(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      type: c.type,
      value: String(c.value),
      minPurchase: c.minPurchase ? String(c.minPurchase) : '',
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
      active: c.active,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/admin/coupons/${editing}` : '/api/admin/coupons';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.coupon) {
      toast.success(editing ? 'Cupón actualizado' : 'Cupón creado');
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } else {
      toast.error(data.error || 'Error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Cupón eliminado'); load(); }
    else toast.error(data.error || 'Error');
  };

  const toggleActive = async (c: Coupon) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    });
    const data = await res.json();
    if (data.coupon) { toast.success(data.coupon.active ? 'Cupón activado' : 'Cupón desactivado'); load(); }
  };

  const isExpired = (c: Coupon) => c.endDate && new Date(c.endDate) < new Date();
  const isUpcoming = (c: Coupon) => c.startDate && new Date(c.startDate) > new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cupones</h1>
          <p className="text-sm text-gray-500 mt-1">{total} cupones</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }}
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nuevo Cupón
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">{editing ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Código *</label>
              <input name="code" value={form.code} onChange={handleChange} required placeholder="DESCUENTO10"
                className="w-full border rounded-lg px-3 py-2 text-sm uppercase" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (USD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor * ({form.type === 'percentage' ? '%' : 'USD'})</label>
              <input name="value" type="number" step="0.01" value={form.value} onChange={handleChange} required
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input name="description" value={form.description} onChange={handleChange} placeholder="Descripción interna del cupón"
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Compra mínima (USD)</label>
              <input name="minPurchase" type="number" step="0.01" value={form.minPurchase} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descuento máximo (USD)</label>
              <input name="maxDiscount" type="number" step="0.01" value={form.maxDiscount} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Sin límite" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Límite de usos</label>
              <input name="usageLimit" type="number" value={form.usageLimit} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ilimitado" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
              <input name="endDate" type="date" value={form.endDate} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input name="active" type="checkbox" checked={form.active as unknown as boolean} onChange={handleChange}
                  className="w-4 h-4 accent-[#e8850c]" />
                <span className="text-sm text-gray-600">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button type="submit" disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Cupón'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Buscar por código</label>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="DESCUENTO10..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
                <th className="p-4">Código</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-right">Mín. compra</th>
                <th className="p-4 text-center">Usos</th>
                <th className="p-4">Vigencia</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <span className="font-mono font-bold text-[#e8850c]">{c.code}</span>
                    {c.description && <div className="text-xs text-gray-400 mt-0.5">{c.description}</div>}
                  </td>
                  <td className="p-4 text-gray-500">{c.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}</td>
                  <td className="p-4 text-right font-bold">{c.type === 'percentage' ? `${c.value}%` : `USD ${c.value.toFixed(2)}`}</td>
                  <td className="p-4 text-right text-gray-500">{c.minPurchase ? `USD ${c.minPurchase.toFixed(2)}` : '-'}</td>
                  <td className="p-4 text-center">
                    <span className="text-gray-600">{c.usedCount}</span>
                    {c.usageLimit && <span className="text-gray-400"> / {c.usageLimit}</span>}
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {c.startDate && <div>Desde: {new Date(c.startDate).toLocaleDateString('es-UY')}</div>}
                    {c.endDate && <div>Hasta: {new Date(c.endDate).toLocaleDateString('es-UY')}</div>}
                    {!c.startDate && !c.endDate && <span>Permanente</span>}
                  </td>
                  <td className="p-4 text-center">
                    {isExpired(c) ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Expirado</span>
                    ) : isUpcoming(c) ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Programado</span>
                    ) : (
                      <button onClick={() => toggleActive(c)}
                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.active ? 'Activo' : 'Inactivo'}
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No se encontraron cupones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {Math.ceil(total / 20) > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">← Anterior</button>}
          <span className="px-3 py-1.5 text-sm text-gray-500">Página {page} de {Math.ceil(total / 20)}</span>
          {page < Math.ceil(total / 20) && <button onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Siguiente →</button>}
        </div>
      )}
    </div>
  );
}

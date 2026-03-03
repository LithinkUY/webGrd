'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  rut: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminClientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '', rut: '' });
  const [saving, setSaving] = useState(false);
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', company: '', active: true });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', role: 'customer' });
    if (search) params.set('search', search);
    if (statusFilter === 'active') params.set('active', 'true');
    if (statusFilter === 'inactive') params.set('active', 'false');
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setClients(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'customer' }),
    });
    const data = await res.json();
    if (data.user) {
      toast.success('Cliente creado');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', phone: '', company: '', rut: '' });
      load();
    } else {
      toast.error(data.error || 'Error');
    }
    setSaving(false);
  };

  const toggleActive = async (c: Client) => {
    const res = await fetch('/api/admin/users', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    const data = await res.json();
    if (data.user) {
      toast.success(data.user.active ? 'Cliente activado (autorizado)' : 'Cliente desactivado');
      load();
    }
  };

  const handlePasswordChange = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    const res = await fetch(`/api/admin/users/${userId}/password`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Contraseña cambiada');
      setEditingPassword(null);
      setNewPassword('');
    } else {
      toast.error(data.error || 'Error');
    }
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setEditForm({ name: c.name, phone: c.phone || '', company: c.company || '', active: c.active });
  };

  const handleEdit = async () => {
    if (!editingClient) return;
    const res = await fetch(`/api/admin/users/${editingClient.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      toast.success('Cliente actualizado');
      setEditingClient(null);
      load();
    } else {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente? Se perderán sus datos.')) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Cliente eliminado'); load(); }
    else toast.error(data.error || 'Error');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{total} clientes registrados</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b]">
          + Nuevo Cliente
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Nuevo Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contraseña *</label>
              <input name="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Empresa</label>
              <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">RUT / CI</label>
              <input value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear Cliente'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {/* Edit modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setEditingClient(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-700 mb-4">Editar Cliente: {editingClient.email}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                <input value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.active} onChange={e => setEditForm({ ...editForm, active: e.target.checked })}
                  className="w-4 h-4 accent-[#e8850c]" />
                <span className="text-sm">Activo (autorizado)</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleEdit} className="bg-[#e8850c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b]">Guardar</button>
              <button onClick={() => setEditingClient(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDetailClient(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-700 mb-4">Detalle de Cliente</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Nombre:</span><span className="font-medium">{detailClient.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-medium">{detailClient.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Teléfono:</span><span>{detailClient.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Empresa:</span><span>{detailClient.company || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">RUT/CI:</span><span>{detailClient.rut || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pedidos:</span><span className="font-bold">{detailClient._count.orders}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estado:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detailClient.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {detailClient.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Registro:</span><span>{new Date(detailClient.createdAt).toLocaleDateString('es-UY')}</span></div>
            </div>
            <div className="flex gap-2 mt-6">
              <Link href={`/admin/pedidos?search=${encodeURIComponent(detailClient.email)}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Ver Pedidos</Link>
              <button onClick={() => setDetailClient(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Buscar</label>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nombre o email..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
        </div>
        <div className="w-40">
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
                <th className="p-4">Cliente</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Empresa</th>
                <th className="p-4 text-center">Pedidos</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4">Registro</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <button onClick={() => setDetailClient(c)} className="text-left">
                      <div className="font-medium text-blue-600 hover:underline">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </button>
                  </td>
                  <td className="p-4 text-gray-500">{c.phone || '-'}</td>
                  <td className="p-4 text-gray-500">{c.company || '-'}</td>
                  <td className="p-4 text-center font-medium">{c._count.orders}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleActive(c)}
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.active ? 'Autorizado' : 'No autorizado'}
                    </button>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString('es-UY')}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      <button onClick={() => setDetailClient(c)} className="text-xs text-blue-600 hover:text-blue-800 px-1">Detalle</button>
                      <button onClick={() => openEdit(c)} className="text-xs text-[#e8850c] hover:text-[#d47a0b] px-1">Editar</button>
                      <button onClick={() => { setEditingPassword(c.id); setNewPassword(''); }}
                        className="text-xs text-purple-600 hover:text-purple-800 px-1">Contraseña</button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:text-red-700 px-1">Eliminar</button>
                    </div>
                    {editingPassword === c.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="Nueva contraseña (mín. 6)"
                          className="border rounded px-2 py-1 text-xs flex-1" />
                        <button onClick={() => handlePasswordChange(c.id)}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-xs">OK</button>
                        <button onClick={() => setEditingPassword(null)}
                          className="text-gray-400 text-xs">✕</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No se encontraron clientes</td></tr>
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

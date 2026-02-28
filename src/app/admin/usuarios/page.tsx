'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: string;
  active: boolean;
  createdAt: string;
  _count: { orders: number };
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  staff: 'bg-blue-100 text-blue-700',
  customer: 'bg-gray-100 text-gray-600',
};

export default function AdminUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.user) {
      toast.success('Usuario creado');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'customer' });
      load();
    } else {
      toast.error(data.error || 'Error');
    }
    setSaving(false);
  };

  const updateUser = async (id: string, changes: { role?: string; active?: boolean }) => {
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...changes }),
    });
    const data = await res.json();
    if (data.user) {
      toast.success('Usuario actualizado');
      load();
    } else {
      toast.error(data.error || 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar usuario?')) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Usuario eliminado');
      load();
    } else {
      toast.error(data.error || 'Error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">{total} usuarios registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nuevo Usuario
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange} required className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rol</label>
            <select name="role" value={form.role} onChange={handleChange} className="border rounded-lg px-3 py-2 text-sm">
              <option value="customer">Cliente</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : "Crear"}
          </button>
        </form>
      )}
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Buscar</label>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nombre o email..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
        </div>
        <div className="w-36">
          <label className="block text-xs text-gray-500 mb-1">Rol</label>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
            <option value="">Todos</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="customer">Cliente</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
                <th className="p-4">Usuario</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Empresa</th>
                <th className="p-4 text-center">Pedidos</th>
                <th className="p-4 text-center">Rol</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4">Registro</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="p-4 text-gray-500">{u.phone || '-'}</td>
                  <td className="p-4 text-gray-500">{u.company || '-'}</td>
                  <td className="p-4 text-center">{u._count.orders}</td>
                  <td className="p-4 text-center">
                    <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${roleColors[u.role] || 'bg-gray-100'}`}>
                      <option value="customer">Cliente</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => updateUser(u.id, { active: !u.active })}
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('es-UY')}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => updateUser(u.id, { active: !u.active })}
                      className="text-xs text-gray-500 hover:text-gray-700">
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No se encontraron usuarios</td></tr>
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

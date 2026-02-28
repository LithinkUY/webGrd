'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ApiSource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string | null;
  active: boolean;
  lastSync: string | null;
  syncInterval: number;
  mapping: string | null;
}

interface SyncLog {
  id: string;
  apiSourceId: string;
  status: string;
  itemsSynced: number;
  itemsFailed: number;
  errors: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export default function AdminApiSync() {
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', baseUrl: '', apiKey: '', apiSecret: '', headers: '',
    active: true, syncInterval: 60, mapping: '',
  });

  const load = useCallback(async () => {
    try {
      const [srcRes, logRes] = await Promise.all([
        fetch('/api/admin/api-sources'),
        fetch('/api/admin/sync-logs'),
      ]);
      if (srcRes.ok) setSources(await srcRes.json());
      if (logRes.ok) setLogs(await logRes.json());
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.baseUrl) {
      toast.error('Nombre y URL son obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/admin/api-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al crear');
      toast.success('API configurada');
      setShowForm(false);
      load();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const syncNow = async (sourceId: string) => {
    toast.loading('Sincronizando...', { id: 'sync' });
    try {
      const res = await fetch(`/api/admin/api-sources/${sourceId}/sync`, { method: 'POST' });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      toast.success(`Sincronización completada: ${data.synced} productos`, { id: 'sync' });
      load();
    } catch {
      toast.error('Error al sincronizar', { id: 'sync' });
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">APIs Externas</h1>
          <p className="text-sm text-gray-500 mt-1">Importar y sincronizar productos desde APIs externas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nueva API
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">Configurar Nueva API</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Mi Proveedor API" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL Base *</label>
              <input type="text" value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} className={inputClass} placeholder="https://api.proveedor.com/v1" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">API Key</label>
              <input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Intervalo sync (min)</label>
              <input type="number" value={form.syncInterval} onChange={e => setForm(f => ({ ...f, syncInterval: parseInt(e.target.value) || 60 }))} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Mapeo de campos (JSON)</label>
              <textarea value={form.mapping} onChange={e => setForm(f => ({ ...f, mapping: e.target.value }))} className={inputClass} rows={4}
                placeholder='{"name": "titulo", "price": "precio", "sku": "codigo", "stock": "cantidad"}' />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b]">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* APIs configuradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sources.map(src => (
          <div key={src.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${src.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <h3 className="font-bold">{src.name}</h3>
              </div>
              <button onClick={() => syncNow(src.id)}
                className="bg-[#1a8a7d] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#158070]">
                🔄 Sincronizar ahora
              </button>
            </div>
            <p className="text-xs text-gray-400 truncate mb-2">{src.baseUrl}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Intervalo: {src.syncInterval} min</span>
              <span>Última sync: {src.lastSync ? new Date(src.lastSync).toLocaleString('es-UY') : 'Nunca'}</span>
            </div>
          </div>
        ))}
        {sources.length === 0 && (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            <p className="text-lg mb-2">🔗</p>
            <p>No hay APIs configuradas</p>
            <p className="text-xs mt-1">Agrega una API externa para importar productos automáticamente</p>
          </div>
        )}
      </div>

      {/* Logs de sincronización */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-lg mb-4">Historial de Sincronización</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b text-xs uppercase">
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-center">Sincronizados</th>
                <th className="pb-3 text-center">Fallidos</th>
                <th className="pb-3">Duración</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-3 text-gray-500">{new Date(log.startedAt).toLocaleString('es-UY')}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-700' :
                      log.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{log.status}</span>
                  </td>
                  <td className="py-3 text-center font-medium">{log.itemsSynced}</td>
                  <td className="py-3 text-center text-red-500">{log.itemsFailed}</td>
                  <td className="py-3 text-gray-500">
                    {log.finishedAt ? `${Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s` : 'En curso...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

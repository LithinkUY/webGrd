'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SyncLog {
  id: string; apiSourceId: string; status: string;
  itemsSynced: number; itemsFailed: number;
  errors: string | null; startedAt: string; finishedAt: string | null;
}

export default function AdminProviderSync() {
  const [config, setConfig] = useState({ sync_email: '', sync_token: '', sync_url: '', sync_last_run: '' });
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [useFullSync, setUseFullSync] = useState(false);

  useEffect(() => {
    fetch('/api/admin/provider-sync')
      .then(r => r.json())
      .then(data => {
        if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
        if (data.logs) setLogs(data.logs);
        if (data.importedCount !== undefined) setImportedCount(data.importedCount);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/provider-sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: config.sync_email, token: config.sync_token, url: config.sync_url }),
    });
    if (res.ok) toast.success('Configuración guardada');
    else toast.error('Error al guardar');
    setSaving(false);
  };

  const handleTestConnection = async () => {
    if (!config.sync_url || !config.sync_email || !config.sync_token) {
      toast.error('Completá URL, email y token antes de probar');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/provider-sync/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: 'Error de red al conectar' });
    }
    setTesting(false);
  };

  const handleSync = async () => {
    if (!config.sync_url) { toast.error('Configurá la URL del web service primero'); return; }
    if (!config.sync_email || !config.sync_token) { toast.error('Configurá email y token primero'); return; }
    setSyncing(true);
    setSyncResult(null);
    try {
      let fecha = '';
      if (useFullSync) {
        fecha = '2015-01-01 00:00:00';
      } else if (customDate) {
        fecha = customDate + ' 00:00:00';
      } else if (config.sync_last_run) {
        fecha = new Date(config.sync_last_run).toISOString().replace('T', ' ').slice(0, 19);
      } else {
        fecha = '2015-01-01 00:00:00';
      }

      const res = await fetch('/api/admin/provider-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha }),
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        toast.success(`Sincronización completada: ${data.synced} productos`);
        const refreshRes = await fetch('/api/admin/provider-sync');
        const refreshData = await refreshRes.json();
        if (refreshData.config) setConfig(prev => ({ ...prev, ...refreshData.config }));
        if (refreshData.logs) setLogs(refreshData.logs);
        if (refreshData.importedCount !== undefined) setImportedCount(refreshData.importedCount);
      } else {
        toast.error(data.error || 'Error en sincronización');
      }
    } catch {
      toast.error('Error de conexión');
    }
    setSyncing(false);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<string, string> = {
      success: 'Exitosa', error: 'Error', partial: 'Parcial', running: 'Ejecutando',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{labels[status] || status}</span>;
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sincronización con Proveedor</h1>
          <p className="text-sm text-gray-500 mt-1">Importar y sincronizar productos desde el catálogo del proveedor via SOAP</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-blue-600 font-medium">📦 {importedCount} productos importados</span>
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="p-5 border-b">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">🔑 Configuración del Proveedor</h2>
          <p className="text-xs text-gray-400 mt-1">URL del Web Service SOAP y credenciales proporcionadas por el proveedor</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">URL del Web Service SOAP</label>
            <input type="url" value={config.sync_url} onChange={e => setConfig({...config, sync_url: e.target.value})}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30 focus:border-[#e8850c] font-mono"
              placeholder="https://www.proveedor.com/ws/productos/service.php?class=..." />
            <p className="text-[10px] text-gray-400 mt-1">Ejemplo: https://dominio.com/ws/productos/service.php?class=SublimewsProductosUsuariosCompleto</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Email del usuario</label>
              <input type="email" value={config.sync_email} onChange={e => setConfig({...config, sync_email: e.target.value})}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30 focus:border-[#e8850c]"
                placeholder="tucuenta@email.com" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 flex items-center justify-between">
                <span>Token API</span>
                <button onClick={() => setShowToken(!showToken)} className="text-[#e8850c] hover:underline">{showToken ? 'Ocultar' : 'Mostrar'}</button>
              </label>
              <input type={showToken ? 'text' : 'password'} value={config.sync_token} onChange={e => setConfig({...config, sync_token: e.target.value})}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30 focus:border-[#e8850c]"
                placeholder="Token del proveedor" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleTestConnection} disabled={testing || saving}
              className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
              {testing ? <><span className="animate-spin">⏳</span> Probando...</> : '🔌 Probar Conexión'}
            </button>
            <button onClick={handleSaveConfig} disabled={saving}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
              {saving ? 'Guardando...' : '💾 Guardar Configuración'}
            </button>
          </div>

          {testResult && (
            <div className={`rounded-lg border p-4 mt-2 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-semibold mb-1 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.success ? '✅ Conexión exitosa' : '❌ Error de conexión'}
              </p>
              <p className="text-sm text-gray-700">{testResult.message || testResult.error}</p>
              {testResult.httpStatus && (
                <p className="text-xs text-gray-400 mt-1">HTTP Status: {testResult.httpStatus}</p>
              )}
              {testResult.rawResponse && (
                <details className="mt-2" open>
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center justify-between">
                    <span>🔍 Respuesta raw del servidor ({testResult.rawResponse.length} chars)</span>
                  </summary>
                  <div className="mt-2 relative">
                    <button
                      onClick={() => navigator.clipboard.writeText(testResult.rawResponse)}
                      className="absolute top-2 right-2 text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded z-10"
                    >📋 Copiar</button>
                    <pre className="text-[10px] bg-white border rounded p-2 pr-16 overflow-x-auto h-64 overflow-y-auto text-gray-600 whitespace-pre-wrap break-all">
                      {testResult.rawResponse}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sincronización */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="p-5 border-b">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">🔄 Sincronizar Productos</h2>
          <p className="text-xs text-gray-400 mt-1">Importar o actualizar productos desde el proveedor. Los productos existentes se actualizan (precio, stock, imágenes).</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 font-medium mb-1">Última sincronización</p>
              <p className="text-sm font-bold text-gray-700">{config.sync_last_run ? new Date(config.sync_last_run).toLocaleString('es-UY') : 'Nunca'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 font-medium mb-1">Tipo de sincronización</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={useFullSync} onChange={e => { setUseFullSync(e.target.checked); if (e.target.checked) setCustomDate(''); }} className="rounded" />
                <span className="text-sm text-gray-700">Catálogo completo</span>
              </label>
              <p className="text-[10px] text-gray-400 mt-1">Trae TODOS los productos (primera vez)</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 font-medium mb-1">O desde fecha específica</p>
              <input type="date" value={customDate} onChange={e => { setCustomDate(e.target.value); setUseFullSync(false); }}
                className="w-full border rounded px-2 py-1.5 text-sm" disabled={useFullSync} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSync} disabled={syncing || !config.sync_url || !config.sync_email || !config.sync_token}
              className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#d17700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              {syncing ? (<><span className="animate-spin">⏳</span> Sincronizando...</>) : (<>🚀 Iniciar Sincronización</>)}
            </button>
            {syncing && <p className="text-sm text-gray-500">Esto puede tomar unos minutos dependiendo del catálogo...</p>}
          </div>
        </div>

        {syncResult && (
          <div className={`mx-5 mb-5 rounded-lg border p-4 ${syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`font-bold text-sm mb-2 ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {syncResult.success ? '✅ Sincronización completada' : '❌ Error en sincronización'}
            </h3>
            {syncResult.success ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Recibidos:</span> <strong>{syncResult.totalReceived}</strong></div>
                <div><span className="text-gray-500">Sincronizados:</span> <strong className="text-green-700">{syncResult.synced}</strong></div>
                <div><span className="text-gray-500">Fallidos:</span> <strong className="text-red-700">{syncResult.failed}</strong></div>
              </div>
            ) : (
              <p className="text-sm text-red-700">{syncResult.error}</p>
            )}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="mt-3 border-t border-yellow-200 pt-3">
                <p className="text-xs font-medium text-yellow-700 mb-1">Errores:</p>
                <div className="max-h-32 overflow-y-auto">
                  {syncResult.errors.map((err: string, i: number) => (
                    <p key={i} className="text-xs text-yellow-600">• {err}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b">
          <h2 className="font-bold text-gray-800">📋 Historial de Sincronizaciones</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay sincronizaciones registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-500">Fecha</th>
                  <th className="text-left p-3 font-medium text-gray-500">Estado</th>
                  <th className="text-center p-3 font-medium text-gray-500">Sincronizados</th>
                  <th className="text-center p-3 font-medium text-gray-500">Fallidos</th>
                  <th className="text-left p-3 font-medium text-gray-500">Duración</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const duration = log.finishedAt && log.startedAt
                    ? Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)
                    : null;
                  return (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-700">{new Date(log.startedAt).toLocaleString('es-UY')}</td>
                      <td className="p-3">{statusBadge(log.status)}</td>
                      <td className="p-3 text-center font-medium text-green-700">{log.itemsSynced}</td>
                      <td className="p-3 text-center font-medium text-red-700">{log.itemsFailed}</td>
                      <td className="p-3 text-gray-500">{duration !== null ? `${duration}s` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-bold text-amber-800 text-sm mb-2">ℹ️ Cómo funciona la sincronización</h3>
        <ul className="text-xs text-amber-700 space-y-1.5">
          <li>• <strong>Primera vez:</strong> Marcá &quot;Catálogo completo&quot; para importar todos los productos</li>
          <li>• <strong>Siguientes veces:</strong> Solo se traen productos actualizados desde la última sincronización</li>
          <li>• <strong>Productos existentes:</strong> Se actualizan precio, stock e imágenes automáticamente</li>
          <li>• <strong>Productos nuevos:</strong> Se crean en la categoría por defecto (podés reasignarlos después)</li>
          <li>• <strong>Identificación:</strong> Cada producto se vincula por su código SKU del proveedor</li>
        </ul>
      </div>
    </div>
  );
}

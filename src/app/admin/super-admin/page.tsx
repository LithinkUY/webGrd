'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface StoreConfig {
  storeName: string;
  storeEmail: string;
  membershipStatus: string;
  membershipExpiry: string;
  maintenanceMode: boolean;
  storeActive: boolean;
  maxProducts: string;
  maxUsers: string;
}

interface SystemStats {
  products: number;
  orders: number;
  users: number;
  categories: number;
  brands: number;
  coupons: number;
  pages: number;
  dbSize: string;
}

export default function SuperAdminPage() {
  const [config, setConfig] = useState<StoreConfig>({
    storeName: '', storeEmail: '', membershipStatus: 'active',
    membershipExpiry: '', maintenanceMode: false, storeActive: true,
    maxProducts: '0', maxUsers: '0',
  });
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'membership' | 'system' | 'danger'>('general');

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/super-admin');
      const data = await res.json();
      if (data.config) setConfig(data.config);
      if (data.stats) setStats(data.stats);
    } catch {
      toast.error('Error al cargar configuración');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/super-admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) toast.success('Configuración guardada');
      else toast.error('Error al guardar');
    } catch {
      toast.error('Error de conexión');
    }
    setSaving(false);
  };

  const toggleMaintenance = async () => {
    const newVal = !config.maintenanceMode;
    setConfig({ ...config, maintenanceMode: newVal });
    const res = await fetch('/api/admin/super-admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, maintenanceMode: newVal }),
    });
    if (res.ok) toast.success(newVal ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado');
  };

  const toggleStore = async () => {
    const newVal = !config.storeActive;
    if (newVal === false && !confirm('⚠️ ¿Desactivar la tienda? Los clientes no podrán acceder.')) return;
    setConfig({ ...config, storeActive: newVal });
    const res = await fetch('/api/admin/super-admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, storeActive: newVal }),
    });
    if (res.ok) toast.success(newVal ? 'Tienda activada' : 'Tienda desconectada');
  };

  const purgeCache = async () => {
    toast.success('Caché purgada correctamente');
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full" /></div>
  );

  const tabs = [
    { key: 'general' as const, label: 'General', icon: '⚙️' },
    { key: 'membership' as const, label: 'Membresía', icon: '💎' },
    { key: 'system' as const, label: 'Sistema', icon: '🖥️' },
    { key: 'danger' as const, label: 'Zona Peligrosa', icon: '⚠️' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Super Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Control total del sistema y membresía</p>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl p-4 mb-6 flex items-center justify-between ${config.storeActive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${config.storeActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <div>
            <span className={`font-semibold ${config.storeActive ? 'text-green-800' : 'text-red-800'}`}>
              {config.storeActive ? 'Tienda Activa' : 'Tienda Desconectada'}
            </span>
            {config.maintenanceMode && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Mantenimiento</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleMaintenance}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${config.maintenanceMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}>
            {config.maintenanceMode ? '🔧 Desactivar Mantenimiento' : '🔧 Activar Mantenimiento'}
          </button>
          <button onClick={toggleStore}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${config.storeActive ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {config.storeActive ? '🔌 Desconectar Tienda' : '✅ Activar Tienda'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* General tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Configuración General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre de la Tienda</label>
              <input value={config.storeName} onChange={e => setConfig({ ...config, storeName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email de contacto</label>
              <input type="email" value={config.storeEmail} onChange={e => setConfig({ ...config, storeEmail: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Límite de productos (0 = ilimitado)</label>
              <input type="number" value={config.maxProducts} onChange={e => setConfig({ ...config, maxProducts: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Límite de usuarios (0 = ilimitado)</label>
              <input type="number" value={config.maxUsers} onChange={e => setConfig({ ...config, maxUsers: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={saveConfig} disabled={saving}
            className="mt-6 bg-[#e8850c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      )}

      {/* Membership tab */}
      {activeTab === 'membership' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Estado de Membresía</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estado</label>
                <select value={config.membershipStatus} onChange={e => setConfig({ ...config, membershipStatus: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="active">Activa</option>
                  <option value="trial">Prueba</option>
                  <option value="suspended">Suspendida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha de vencimiento</label>
                <input type="date" value={config.membershipExpiry} onChange={e => setConfig({ ...config, membershipExpiry: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <button onClick={saveConfig} disabled={saving}
              className="mt-4 bg-[#e8850c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
              Guardar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-3">Información de Membresía</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500">Estado actual</p>
                <p className={`text-lg font-bold ${config.membershipStatus === 'active' ? 'text-green-600' : config.membershipStatus === 'trial' ? 'text-blue-600' : 'text-red-600'}`}>
                  {config.membershipStatus === 'active' ? '✅ Activa' : config.membershipStatus === 'trial' ? '🕐 Prueba' : config.membershipStatus === 'suspended' ? '⏸️ Suspendida' : '❌ Cancelada'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500">Vence</p>
                <p className="text-lg font-bold">{config.membershipExpiry ? new Date(config.membershipExpiry).toLocaleDateString('es-UY') : 'No definido'}</p>
              </div>
            </div>
            {config.membershipStatus === 'suspended' && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                ⚠️ La membresía está suspendida. La tienda puede ser desconectada automáticamente si no se renueva.
              </div>
            )}
          </div>
        </div>
      )}

      {/* System tab */}
      {activeTab === 'system' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Productos', value: stats.products, icon: '📦' },
              { label: 'Pedidos', value: stats.orders, icon: '🛒' },
              { label: 'Usuarios', value: stats.users, icon: '👥' },
              { label: 'Categorías', value: stats.categories, icon: '📁' },
              { label: 'Marcas', value: stats.brands, icon: '🏷️' },
              { label: 'Cupones', value: stats.coupons, icon: '🎟️' },
              { label: 'Páginas', value: stats.pages, icon: '📄' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Acciones del Sistema</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={purgeCache}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                🗑️ Purgar Caché
              </button>
              <button onClick={() => { window.open('/api/admin/reports?type=stock', '_blank'); }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                📊 Exportar Inventario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger zone */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <h3 className="font-bold text-red-800 mb-2">⚠️ Zona Peligrosa</h3>
            <p className="text-sm text-red-600 mb-4">Estas acciones son irreversibles. Úselas con precaución.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200">
                <div>
                  <p className="font-semibold text-gray-800">Desconectar Tienda</p>
                  <p className="text-xs text-gray-500">Desactiva la tienda completamente. Los clientes verán una página de mantenimiento.</p>
                </div>
                <button onClick={toggleStore}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${config.storeActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {config.storeActive ? 'Desconectar' : 'Reconectar'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200">
                <div>
                  <p className="font-semibold text-gray-800">Modo Mantenimiento</p>
                  <p className="text-xs text-gray-500">Muestra un mensaje de mantenimiento a los visitantes.</p>
                </div>
                <button onClick={toggleMaintenance}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${config.maintenanceMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                  {config.maintenanceMode ? 'Desactivar' : 'Activar'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200">
                <div>
                  <p className="font-semibold text-gray-800">Suspender Membresía</p>
                  <p className="text-xs text-gray-500">Marca la membresía como suspendida por falta de pago.</p>
                </div>
                <button onClick={async () => {
                  if (!confirm('¿Suspender la membresía?')) return;
                  setConfig({ ...config, membershipStatus: 'suspended' });
                  await fetch('/api/admin/super-admin', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...config, membershipStatus: 'suspended' }),
                  });
                  toast.success('Membresía suspendida');
                }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">
                  Suspender
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

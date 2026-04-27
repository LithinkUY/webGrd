'use client';

import { useState, useEffect } from 'react';

interface StatusData {
  stockba: any;
  syncedProducts: number;
  lastSyncAt: string | null;
  apiKeyConfigured: boolean;
}

interface SyncResult {
  ok: boolean;
  created?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  errors?: string[];
  error?: string;
  message?: string;
}

export default function AdminStockBAPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);
  const [overwritePrice, setOverwritePrice] = useState(false);
  const [syncImages, setSyncImages] = useState(true);

  const [productResult, setProductResult] = useState<SyncResult | null>(null);
  const [stockResult, setStockResult] = useState<SyncResult | null>(null);

  const loadStatus = () => {
    setLoadingStatus(true);
    fetch('/api/admin/stockba/status')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSyncProducts = async () => {
    setSyncingProducts(true);
    setProductResult(null);
    try {
      const res = await fetch('/api/admin/stockba/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwritePrice, syncImages }),
      });
      const data = await res.json();
      setProductResult(data);
      if (data.ok) loadStatus();
    } catch (e: any) {
      setProductResult({ ok: false, error: e.message });
    } finally {
      setSyncingProducts(false);
    }
  };

  const handleSyncStock = async () => {
    setSyncingStock(true);
    setStockResult(null);
    try {
      const res = await fetch('/api/admin/stockba/sync-stock', { method: 'POST' });
      const data = await res.json();
      setStockResult(data);
      if (data.ok) loadStatus();
    } catch (e: any) {
      setStockResult({ ok: false, error: e.message });
    } finally {
      setSyncingStock(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integración StockBA</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sincronización bidireccional con el sistema de facturación StockBA
        </p>
      </div>

      {/* ── Status Card ────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📡 Estado de la conexión
          <button
            onClick={loadStatus}
            disabled={loadingStatus}
            className="ml-auto text-sm text-blue-600 hover:underline"
          >
            {loadingStatus ? 'Cargando…' : '↺ Actualizar'}
          </button>
        </h2>

        {loadingStatus ? (
          <p className="text-gray-400 text-sm">Verificando…</p>
        ) : status ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="API Key"
              value={status.apiKeyConfigured ? '✅ Configurada' : '❌ No configurada'}
              color={status.apiKeyConfigured ? 'green' : 'red'}
            />
            <StatCard
              label="Productos sincronizados"
              value={String(status.syncedProducts)}
            />
            <StatCard
              label="Última sincronización"
              value={
                status.lastSyncAt
                  ? new Date(status.lastSyncAt).toLocaleString('es-AR')
                  : '—'
              }
            />
            {status.stockba && (
              <StatCard
                label="Ventas StockBA (hoy)"
                value={status.stockba?.today_sells ?? '—'}
              />
            )}
          </div>
        ) : (
          <p className="text-red-500 text-sm">No se pudo obtener estado</p>
        )}

        {status && !status.apiKeyConfigured && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ Configurá la variable de entorno <code className="font-mono bg-yellow-100 px-1 rounded">STOCKBA_API_KEY</code> en Vercel para habilitar la integración.
          </div>
        )}
      </div>

      {/* ── Sync Products ───────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-1">📦 Importar productos desde StockBA</h2>
        <p className="text-sm text-gray-500 mb-4">
          Importa todos los productos activos de StockBA a la tienda. Los productos ya importados se actualizan (nombre, stock, etc.).
        </p>

        <div className="flex flex-wrap gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overwritePrice}
              onChange={(e) => setOverwritePrice(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Sobreescribir precios existentes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncImages}
              onChange={(e) => setSyncImages(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Importar imágenes de StockBA</span>
          </label>
        </div>

        <button
          onClick={handleSyncProducts}
          disabled={syncingProducts}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          {syncingProducts ? '⏳ Sincronizando productos…' : '🔄 Sincronizar productos'}
        </button>

        {productResult && (
          <ResultBox result={productResult} />
        )}
      </div>

      {/* ── Sync Stock ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-1">📊 Actualizar stock desde StockBA</h2>
        <p className="text-sm text-gray-500 mb-4">
          Actualiza solo los niveles de stock de los productos ya importados desde StockBA, sin tocar precios ni descripciones.
        </p>

        <button
          onClick={handleSyncStock}
          disabled={syncingStock}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          {syncingStock ? '⏳ Actualizando stock…' : '📦 Actualizar stock'}
        </button>

        {stockResult && (
          <ResultBox result={stockResult} />
        )}
      </div>

      {/* ── Info Panel ──────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl border p-6 text-sm text-gray-600 space-y-2">
        <h3 className="font-semibold text-gray-800 mb-2">ℹ️ Información</h3>
        <p>• La integración usa la API REST de StockBA (<code className="font-mono bg-gray-100 px-1 rounded">stockba.es/api/v1</code>)</p>
        <p>• Los productos importados quedan vinculados por <code className="font-mono bg-gray-100 px-1 rounded">sourceId</code> + <code className="font-mono bg-gray-100 px-1 rounded">sourceApi = "stockba"</code></p>
        <p>• El stock se suma de todas las ubicaciones del depósito</p>
        <p>• La función de crear venta en StockBA estará disponible cuando la API habilite <code className="font-mono bg-gray-100 px-1 rounded">POST /sells</code></p>
        <p>• Variable de entorno requerida: <code className="font-mono bg-gray-100 px-1 rounded">STOCKBA_API_KEY</code></p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: string;
  color?: 'green' | 'red' | 'gray';
}) {
  const colors = {
    green: 'text-green-700',
    red: 'text-red-600',
    gray: 'text-gray-800',
  };
  return (
    <div className="bg-gray-50 rounded-lg p-3 border">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-semibold text-sm ${colors[color]}`}>{value}</p>
    </div>
  );
}

function ResultBox({ result }: { result: SyncResult }) {
  const isOk = result.ok;
  return (
    <div
      className={`mt-4 p-4 rounded-lg border text-sm ${
        isOk
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {isOk ? (
        <>
          <p className="font-semibold mb-1">✅ Completado</p>
          {result.total !== undefined && (
            <p>Total en StockBA: <strong>{result.total}</strong></p>
          )}
          {result.created !== undefined && (
            <p>Creados: <strong>{result.created}</strong></p>
          )}
          {result.updated !== undefined && (
            <p>Actualizados: <strong>{result.updated}</strong></p>
          )}
          {result.skipped !== undefined && result.skipped > 0 && (
            <p>Con errores: <strong>{result.skipped}</strong></p>
          )}
          {result.message && <p className="mt-1 text-xs opacity-80">{result.message}</p>}
        </>
      ) : (
        <>
          <p className="font-semibold mb-1">❌ Error</p>
          <p>{result.error || 'Error desconocido'}</p>
        </>
      )}
      {result.errors && result.errors.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs opacity-70">Ver errores ({result.errors.length})</summary>
          <ul className="mt-1 space-y-0.5 text-xs opacity-80">
            {result.errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

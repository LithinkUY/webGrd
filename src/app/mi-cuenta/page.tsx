'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

type TabKey = 'perfil' | 'direcciones' | 'pedidos';

interface UserProfile {
  id: string; name: string; email: string; phone: string | null;
  company: string | null; rut: string | null; address: string | null;
  city: string | null; createdAt: string;
}

interface Address {
  id: string; label: string; fullName: string; phone: string | null;
  address: string; city: string; state: string | null; zipCode: string | null;
  country: string; isDefault: boolean;
}

interface OrderItem { name: string; sku: string; quantity: number; price: number; subtotal: number; }
interface Order {
  id: string; orderNumber: string; total: number; subtotal: number; shipping: number;
  status: string; paymentStatus: string; paymentMethod: string | null;
  createdAt: string; items: OrderItem[];
  trackingNumber: string | null; trackingUrl: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Procesando', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' },
};

const paymentLabels: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', failed: 'Fallido', refunded: 'Reembolsado',
};

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'perfil', label: 'Mi Perfil', icon: '👤' },
  { key: 'direcciones', label: 'Direcciones', icon: '📍' },
  { key: 'pedidos', label: 'Mis Pedidos', icon: '📦' },
];

export default function MyAccountPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>('perfil');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch('/api/user/profile').then(r => r.json()),
      fetch('/api/user/addresses').then(r => r.json()),
      fetch('/api/orders/mine').then(r => r.json()),
    ]).then(([p, a, o]) => {
      setProfile(p);
      if (Array.isArray(a)) setAddresses(a);
      if (Array.isArray(o)) setOrders(o);
      setLoading(false);
    });
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Iniciá sesión</h1>
          <p className="text-gray-500 mb-4">Necesitás estar logueado para ver tu cuenta</p>
          <Link href="/auth/login" className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#d17700] transition-colors">Iniciar Sesión</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-[#e8850c] rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {session.user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hola, {session.user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500">{session.user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border p-1 mb-8">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-[#e8850c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key === 'pedidos' && orders.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/25' : 'bg-gray-200'}`}>{orders.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'perfil' && <ProfileTab profile={profile} setProfile={setProfile} />}
      {activeTab === 'direcciones' && <AddressesTab addresses={addresses} setAddresses={setAddresses} />}
      {activeTab === 'pedidos' && <OrdersTab orders={orders} />}
    </div>
  );
}

function ProfileTab({ profile, setProfile }: { profile: UserProfile | null; setProfile: (p: UserProfile) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || '', phone: profile?.phone || '', company: profile?.company || '',
    rut: profile?.rut || '', address: profile?.address || '', city: profile?.city || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setEditing(false);
      toast.success('Perfil actualizado');
    } else { toast.error('Error al guardar'); }
    setSaving(false);
  };

  const fields = [
    { key: 'name', label: 'Nombre completo', icon: '👤' },
    { key: 'phone', label: 'Teléfono', icon: '📱' },
    { key: 'company', label: 'Empresa', icon: '🏢' },
    { key: 'rut', label: 'RUT / CI', icon: '🪪' },
    { key: 'address', label: 'Dirección', icon: '📍' },
    { key: 'city', label: 'Ciudad', icon: '🏙️' },
  ];

  return (
    <div className="bg-white rounded-xl border">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-bold text-gray-800">Información Personal</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-sm text-[#e8850c] hover:text-[#d17700] font-medium">✏️ Editar</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="text-sm bg-[#e8850c] text-white px-4 py-1.5 rounded-lg font-medium hover:bg-[#d17700] disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        )}
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><span>{f.icon}</span> {f.label}</label>
            {editing ? (
              <input type="text" value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30 focus:border-[#e8850c]" />
            ) : (
              <p className="text-sm text-gray-800 font-medium py-2">{(profile as any)?.[f.key] || <span className="text-gray-300 italic">Sin completar</span>}</p>
            )}
          </div>
        ))}
      </div>
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-400">Email: <span className="text-gray-600 font-medium">{profile?.email}</span> (no editable)</p>
          <p className="text-xs text-gray-400 mt-1">Miembro desde: <span className="text-gray-600 font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-UY', { year: 'numeric', month: 'long' }) : ''}</span></p>
        </div>
      </div>
    </div>
  );
}

function AddressesTab({ addresses, setAddresses }: { addresses: Address[]; setAddresses: (a: Address[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: 'Casa', fullName: '', phone: '', address: '', city: '', state: '', zipCode: '', country: 'Uruguay', isDefault: false });
  const [saving, setSaving] = useState(false);

  const resetForm = () => { setForm({ label: 'Casa', fullName: '', phone: '', address: '', city: '', state: '', zipCode: '', country: 'Uruguay', isDefault: false }); setEditingId(null); setShowForm(false); };

  const handleEdit = (addr: Address) => {
    setForm({ label: addr.label, fullName: addr.fullName, phone: addr.phone || '', address: addr.address, city: addr.city, state: addr.state || '', zipCode: addr.zipCode || '', country: addr.country, isDefault: addr.isDefault });
    setEditingId(addr.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.address || !form.city) { toast.error('Completá nombre, dirección y ciudad'); return; }
    setSaving(true);
    const url = editingId ? `/api/user/addresses/${editingId}` : '/api/user/addresses';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      const refreshed = await fetch('/api/user/addresses').then(r => r.json());
      setAddresses(refreshed);
      resetForm();
      toast.success(editingId ? 'Dirección actualizada' : 'Dirección agregada');
    } else { toast.error('Error al guardar'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    const res = await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
    if (res.ok) { setAddresses(addresses.filter(a => a.id !== id)); toast.success('Dirección eliminada'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Mis Direcciones</h2>
        {!showForm && <button onClick={() => setShowForm(true)} className="text-sm bg-[#e8850c] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#d17700]">+ Agregar</button>}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-bold mb-4">{editingId ? 'Editar Dirección' : 'Nueva Dirección'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Etiqueta</label>
              <select value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option>Casa</option><option>Trabajo</option><option>Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre completo *</label>
              <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Dirección *</label>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ciudad *</label>
              <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Departamento</label>
              <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Código Postal</label>
              <input value={form.zipCode} onChange={e => setForm({...form, zipCode: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="rounded" />
              <label htmlFor="isDefault" className="text-sm text-gray-600">Usar como dirección predeterminada</label>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleSave} disabled={saving} className="bg-[#e8850c] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#d17700] disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            <button onClick={resetForm} className="text-gray-500 px-4 py-2 rounded-lg text-sm border hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-5xl mb-3">📍</div>
          <p className="text-gray-500">No tenés direcciones guardadas</p>
          <button onClick={() => setShowForm(true)} className="text-[#e8850c] font-medium text-sm mt-2 hover:underline">Agregar una dirección</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className={`bg-white rounded-xl border p-5 relative ${addr.isDefault ? 'ring-2 ring-[#e8850c]/30 border-[#e8850c]' : ''}`}>
              {addr.isDefault && <span className="absolute top-3 right-3 text-xs bg-[#e8850c] text-white px-2 py-0.5 rounded-full">Predeterminada</span>}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{addr.label === 'Casa' ? '🏠' : addr.label === 'Trabajo' ? '🏢' : '📍'}</span>
                <span className="font-bold text-sm">{addr.label}</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{addr.fullName}</p>
              <p className="text-sm text-gray-500">{addr.address}</p>
              <p className="text-sm text-gray-500">{addr.city}{addr.state ? ', ' + addr.state : ''} {addr.zipCode || ''}</p>
              {addr.phone && <p className="text-sm text-gray-500">Tel: {addr.phone}</p>}
              <div className="flex gap-3 mt-3 pt-3 border-t">
                <button onClick={() => handleEdit(addr)} className="text-xs text-[#e8850c] hover:underline font-medium">Editar</button>
                <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 hover:underline font-medium">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePdf = (orderId: string) => {
    window.open(`/api/orders/${orderId}/pdf`, '_blank');
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <div className="text-5xl mb-3">📦</div>
        <p className="text-gray-500 mb-2">No tenés pedidos todavía</p>
        <Link href="/productos" className="text-[#e8850c] font-medium text-sm hover:underline">Ir a comprar →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const expanded = expandedId === order.id;
        const st = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
        return (
          <div key={order.id} className="bg-white rounded-xl border overflow-hidden">
            {/* Order header */}
            <button onClick={() => setExpandedId(expanded ? null : order.id)} className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">📦</div>
                <div>
                  <p className="font-bold text-sm text-gray-800">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('es-UY', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                <span className="font-bold text-gray-800">{formatPrice(order.total)}</span>
                <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
              </div>
            </button>

            {expanded && (
              <div className="border-t">
                {/* Items */}
                <div className="p-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b">
                        <th className="text-left pb-2 font-medium">Producto</th>
                        <th className="text-center pb-2 font-medium">Cant.</th>
                        <th className="text-right pb-2 font-medium">Precio</th>
                        <th className="text-right pb-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2.5">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                          </td>
                          <td className="text-center text-gray-600">{item.quantity}</td>
                          <td className="text-right text-gray-600">{formatPrice(item.price)}</td>
                          <td className="text-right font-medium text-gray-800">{formatPrice(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 px-5 py-4 flex items-center justify-between">
                  <div className="flex gap-6 text-xs text-gray-500">
                    <span>Subtotal: <strong className="text-gray-700">{formatPrice(order.subtotal)}</strong></span>
                    {order.shipping > 0 && <span>Envío: <strong className="text-gray-700">{formatPrice(order.shipping)}</strong></span>}
                    <span>Pago: <strong className="text-gray-700">{paymentLabels[order.paymentStatus] || order.paymentStatus}</strong></span>
                    {order.trackingNumber && <span>Tracking: <strong className="text-gray-700">{order.trackingUrl ? <a href={order.trackingUrl} target="_blank" className="text-[#e8850c] hover:underline">{order.trackingNumber}</a> : order.trackingNumber}</strong></span>}
                  </div>
                  <button onClick={() => handlePdf(order.id)} className="flex items-center gap-1.5 text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors">
                    📄 Ver comprobante
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
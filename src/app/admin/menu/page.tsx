'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpIcon, ArrowDownIcon, EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  showInMenu: boolean;
  menuOrder: number;
  icon: string | null;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  showInMenu: boolean;
  menuOrder: number;
  icon: string | null;
  children: SubCategory[];
  _count: { products: number };
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string | null;
  sortOrder: number;
  active: boolean;
  openNew: boolean;
  children: MenuItem[];
}

export default function AdminMenu() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'categories' | 'custom'>('categories');

  // Form para items custom
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({ label: '', href: '', icon: '', sortOrder: 0, active: true, openNew: false });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      setCategories(data.categories || []);
      setMenuItems(data.menuItems || []);
    } catch {
      toast.error('Error al cargar menú');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ======= CATEGORÍAS EN MENÚ =======

  const toggleCategoryMenu = (catId: string) => {
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, showInMenu: !c.showInMenu } : c
    ));
  };

  const toggleSubMenu = (parentId: string, subId: string) => {
    setCategories(prev => prev.map(c =>
      c.id === parentId
        ? { ...c, children: c.children.map(s => s.id === subId ? { ...s, showInMenu: !s.showInMenu } : s) }
        : c
    ));
  };

  const moveCat = (index: number, dir: -1 | 1) => {
    setCategories(prev => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr.map((c, i) => ({ ...c, menuOrder: i }));
    });
  };

  const saveCategories = async () => {
    setSaving(true);
    try {
      // Flatten: padres + hijos
      const flat = categories.flatMap((c, i) => [
        { id: c.id, showInMenu: c.showInMenu, menuOrder: i },
        ...c.children.map((s, j) => ({ id: s.id, showInMenu: s.showInMenu, menuOrder: j })),
      ]);

      const res = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: flat }),
      });

      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Menú de categorías guardado');
    } catch {
      toast.error('Error al guardar');
    }
    setSaving(false);
  };

  // ======= ITEMS CUSTOM =======

  const resetItemForm = () => {
    setItemForm({ label: '', href: '', icon: '', sortOrder: 0, active: true, openNew: false });
    setEditingItem(null);
    setShowItemForm(false);
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      label: item.label,
      href: item.href,
      icon: item.icon || '',
      sortOrder: item.sortOrder,
      active: item.active,
      openNew: item.openNew,
    });
    setShowItemForm(true);
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.label || !itemForm.href) { toast.error('Nombre y URL son obligatorios'); return; }

    try {
      const url = editingItem ? `/api/admin/menu/items/${editingItem.id}` : '/api/admin/menu/items';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm),
      });

      if (!res.ok) throw new Error('Error al guardar');
      toast.success(editingItem ? 'Item actualizado' : 'Item creado');
      resetItemForm();
      load();
    } catch {
      toast.error('Error al guardar item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este item del menú?')) return;
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Item eliminado');
      load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // ======= PREVIEW =======

  const visibleCats = categories.filter(c => c.showInMenu);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menú y Navegación</h1>
          <p className="text-sm text-gray-500 mt-1">Configura qué categorías y links aparecen en la barra de navegación</p>
        </div>
      </div>

      {/* Preview del menú */}
      <div className="bg-[#2a2a2a] rounded-xl p-4 mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Vista previa del menú</p>
        <div className="flex items-center gap-1 overflow-x-auto">
          {visibleCats.map(c => (
            <div key={c.id} className="group relative flex-shrink-0">
              <span className="px-3 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors cursor-default whitespace-nowrap">
                {c.icon && <span className="mr-1">{c.icon}</span>}
                {c.name}
              </span>
              {c.children.filter(s => s.showInMenu).length > 0 && (
                <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-[#333] rounded-lg shadow-xl py-1 z-10 min-w-[160px]">
                  {c.children.filter(s => s.showInMenu).map(s => (
                    <span key={s.id} className="block px-3 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-[#444] transition-colors">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {menuItems.filter(i => i.active).map(item => (
            <span key={item.id} className="px-3 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors cursor-default whitespace-nowrap flex-shrink-0">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.label}
            </span>
          ))}
          {visibleCats.length === 0 && menuItems.filter(i => i.active).length === 0 && (
            <span className="text-gray-500 text-xs italic">No hay elementos visibles en el menú</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'categories' ? 'bg-[#e8850c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          📁 Categorías ({categories.length})
        </button>
        <button
          onClick={() => setTab('custom')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'custom' ? 'bg-[#e8850c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          🔗 Links personalizados ({menuItems.length})
        </button>
      </div>

      {/* TAB: Categorías */}
      {tab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">Activa/desactiva categorías y reordénalas con las flechas</p>
            <button
              onClick={saveCategories}
              disabled={saving}
              className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : '💾 Guardar orden'}
            </button>
          </div>

          <div className="divide-y">
            {categories.map((cat, index) => (
              <div key={cat.id}>
                {/* Categoría padre */}
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="flex gap-1">
                    <button onClick={() => moveCat(index, -1)} disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors">
                      <ArrowUpIcon className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => moveCat(index, 1)} disabled={index === categories.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors">
                      <ArrowDownIcon className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <button onClick={() => toggleCategoryMenu(cat.id)}
                    className={`p-1.5 rounded-lg transition-colors ${cat.showInMenu ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    title={cat.showInMenu ? 'Visible en menú' : 'Oculto del menú'}
                  >
                    {cat.showInMenu ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                  </button>

                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-800">{cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}</span>
                    <span className="text-xs text-gray-400 ml-2">/{cat.slug}</span>
                  </div>

                  <span className="text-xs text-gray-400">{cat._count.products} productos</span>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.showInMenu ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.showInMenu ? 'EN MENÚ' : 'OCULTA'}
                  </span>
                </div>

                {/* Subcategorías */}
                {cat.children.length > 0 && cat.showInMenu && (
                  <div className="bg-gray-50/50 border-l-4 border-[#e8850c]/20 ml-12">
                    {cat.children.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100">
                        <button onClick={() => toggleSubMenu(cat.id, sub.id)}
                          className={`p-1 rounded transition-colors ${sub.showInMenu ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {sub.showInMenu ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[13px] text-gray-600">↳ {sub.name}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {sub.showInMenu ? 'En submenú' : 'Oculta'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">
                No hay categorías. Crea algunas en <a href="/admin/categorias" className="text-[#e8850c] underline">Categorías</a>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Links personalizados */}
      {tab === 'custom' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">Links personalizados que aparecen al final del menú</p>
            <button
              onClick={() => { resetItemForm(); setShowItemForm(true); }}
              className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" /> Nuevo link
            </button>
          </div>

          {/* Form */}
          {showItemForm && (
            <div className="p-4 border-b bg-[#fef9f4]">
              <form onSubmit={saveItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                  <input type="text" value={itemForm.label} onChange={e => setItemForm(f => ({ ...f, label: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30"
                    placeholder="Ej: Ofertas" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">URL *</label>
                  <input type="text" value={itemForm.href} onChange={e => setItemForm(f => ({ ...f, href: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30"
                    placeholder="Ej: /productos?sort=price_asc" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ícono (emoji)</label>
                  <input type="text" value={itemForm.icon} onChange={e => setItemForm(f => ({ ...f, icon: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30"
                    placeholder="🔥" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={itemForm.active} onChange={e => setItemForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded" />
                    Activo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={itemForm.openNew} onChange={e => setItemForm(f => ({ ...f, openNew: e.target.checked }))} className="w-4 h-4 rounded" />
                    Abrir en nueva pestaña
                  </label>
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <button type="submit" className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b]">
                    {editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                  <button type="button" onClick={resetItemForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista */}
          <div className="divide-y">
            {menuItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800">
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{item.href}</span>
                  {item.openNew && <span className="text-[10px] text-blue-500 ml-2">↗ nueva pestaña</span>}
                </div>
                <button onClick={() => startEditItem(item)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {menuItems.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">
                No hay links personalizados. Agrega uno con el botón de arriba.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

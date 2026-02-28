'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface PayMethod { id: string; label: string; icon: string; enabled: boolean; desc: string; }
interface Slide { image: string; link: string; alt: string; }

const DEFAULT_METHODS: PayMethod[] = [
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦', enabled: true, desc: 'Transferí a cualquiera de nuestras cuentas bancarias' },
  { id: 'mercadopago', label: 'MercadoPago', icon: '💙', enabled: true, desc: 'Pagá con tarjeta, débito o saldo MercadoPago' },
  { id: 'contado', label: 'Contado en local', icon: '💵', enabled: true, desc: 'Pagá en efectivo al retirar en nuestro local' },
  { id: 'credito', label: 'Tarjeta de Crédito', icon: '💳', enabled: false, desc: 'Visa, Mastercard, OCA y más' },
];

const DEFAULT_SLIDES: Slide[] = [
  { image: '/banners/presentaciones0_7579.jpg', link: '/productos?brand=asano', alt: 'Asano' },
  { image: '/banners/presentaciones0_7654.jpg', link: '/productos?brand=biostar', alt: 'Biostar' },
  { image: '/banners/presentaciones0_7714.jpg', link: '/productos?brand=logitech', alt: 'Logitech' },
  { image: '/banners/presentaciones0_7743.jpg', link: '/productos', alt: 'Rebate' },
  { image: '/banners/presentaciones0_7798.jpg', link: '/productos?brand=bambu-lab', alt: 'Bambu Lab' },
  { image: '/banners/presentaciones0_7808.jpg', link: '/productos', alt: 'Web Service' },
  { image: '/banners/presentaciones0_7817.jpg', link: '/productos?brand=lexar', alt: 'Lexar' },
];

export default function AparienciaPage() {
  const [tab, setTab] = useState<'identidad' | 'footer' | 'pagos' | 'colores' | 'slider'>('identidad');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Identidad / Logo
  const [logoText, setLogoText] = useState('ImpoTech');
  const [logoColor, setLogoColor] = useState('#e8850c');
  const [logoAccent, setLogoAccent] = useState('Impo');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  // Colores del sitio
  const [colorPrimary, setColorPrimary] = useState('#e8850c');
  const [colorSecondary, setColorSecondary] = useState('#333333');
  const [colorAccent, setColorAccent] = useState('#fe3439');
  const [colorBg, setColorBg] = useState('#f5f5f5');

  // Footer
  const [footerDesc, setFooterDesc] = useState('La tienda de insumos de tecnología con mayor servicio y variedad.');
  const [footerPhone1, setFooterPhone1] = useState('2929 0990');
  const [footerPhone2, setFooterPhone2] = useState('2924 9009');
  const [footerEmail, setFooterEmail] = useState('info@impotech.com.uy');
  const [footerHours, setFooterHours] = useState('Lun. a Vie. de 9.30 a 12.30 y de 13.30 a 18.30 hs.');
  const [footerAddress, setFooterAddress] = useState('Bacigalupi 2084 esq. Lima');
  const [footerService, setFooterService] = useState('Lima 1668');
  const [footerBankInfo, setFooterBankInfo] = useState(
    'BROU Cta. Cte. USD 1559417-00001 | SANTANDER Cta. Cte. USD 005100207330 | SCOTIABANK Cta. Cte. USD 2513484200'
  );
  const [footerCopyright, setFooterCopyright] = useState('ImpoTech');

  // Slider
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [newSlide, setNewSlide] = useState<Slide>({ image: '', link: '/productos', alt: '' });

  // Métodos de pago
  const [methods, setMethods] = useState<PayMethod[]>(DEFAULT_METHODS);
  const [newMethod, setNewMethod] = useState({ id: '', label: '', icon: '💳', desc: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, methodsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/payment-methods'),
      ]);
      const settingsData: { key: string; value: string }[] = await settingsRes.json();
      const methodsData = await methodsRes.json();

      const s: Record<string, string> = {};
      for (const item of settingsData) s[item.key] = item.value;

      if (s.logo_text) setLogoText(s.logo_text);
      if (s.logo_color) setLogoColor(s.logo_color);
      if (s.logo_accent) setLogoAccent(s.logo_accent);
      if (s.logo_image_url) setLogoImageUrl(s.logo_image_url);
      if (s.favicon_url) setFaviconUrl(s.favicon_url);
      if (s.footer_desc) setFooterDesc(s.footer_desc);
      if (s.footer_phone1) setFooterPhone1(s.footer_phone1);
      if (s.footer_phone2) setFooterPhone2(s.footer_phone2);
      if (s.footer_email) setFooterEmail(s.footer_email);
      if (s.footer_hours) setFooterHours(s.footer_hours);
      if (s.footer_address) setFooterAddress(s.footer_address);
      if (s.footer_service) setFooterService(s.footer_service);
      if (s.footer_bank_info) setFooterBankInfo(s.footer_bank_info);
      if (s.footer_copyright) setFooterCopyright(s.footer_copyright);
      if (s.color_primary) setColorPrimary(s.color_primary);
      if (s.color_secondary) setColorSecondary(s.color_secondary);
      if (s.color_accent) setColorAccent(s.color_accent);
      if (s.color_bg) setColorBg(s.color_bg);
      if (s.hero_slides) {
        try { const p = JSON.parse(s.hero_slides); if (Array.isArray(p) && p.length) setSlides(p); } catch {}
      }
      if (methodsData.methods?.length) setMethods(methodsData.methods);
    } catch { toast.error('Error cargando configuración'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async (settings: Record<string, string>, label = 'Guardado') => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      toast.success(label);
    } catch { toast.error('Error guardando'); }
    setSaving(false);
  };

  const saveIdentidad = () => saveSettings({
    logo_text: logoText, logo_color: logoColor, logo_accent: logoAccent,
    favicon_url: faviconUrl, logo_image_url: logoImageUrl,
  }, 'Logo guardado');

  const saveFooter = () => saveSettings({
    footer_desc: footerDesc, footer_phone1: footerPhone1, footer_phone2: footerPhone2,
    footer_email: footerEmail, footer_hours: footerHours, footer_address: footerAddress,
    footer_service: footerService, footer_bank_info: footerBankInfo, footer_copyright: footerCopyright,
  }, 'Footer guardado');

  const saveColores = () => saveSettings({
    color_primary: colorPrimary, color_secondary: colorSecondary,
    color_accent: colorAccent, color_bg: colorBg,
    // Sincroniza color_primary como logo_color también
    logo_color: colorPrimary,
  }, 'Colores guardados');

  const saveSlider = () => saveSettings({
    hero_slides: JSON.stringify(slides),
  }, 'Slider guardado');

  const saveMethods = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methods }),
      });
      toast.success('Métodos de pago guardados');
    } catch { toast.error('Error'); }
    setSaving(false);
  };

  // Slider helpers
  const addSlide = () => {
    if (!newSlide.image) { toast.error('La URL de imagen es requerida'); return; }
    setSlides(prev => [...prev, { ...newSlide }]);
    setNewSlide({ image: '', link: '/productos', alt: '' });
  };
  const removeSlide = (i: number) => setSlides(prev => prev.filter((_, idx) => idx !== i));
  const moveSlide = (i: number, dir: -1 | 1) => {
    const arr = [...slides];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSlides(arr);
  };

  const toggleMethod = (id: string) => setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  const updateMethodField = (id: string, field: keyof PayMethod, value: string) =>
    setMethods(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  const addMethod = () => {
    if (!newMethod.id || !newMethod.label) { toast.error('ID y nombre son requeridos'); return; }
    if (methods.find(m => m.id === newMethod.id)) { toast.error('Ya existe un método con ese ID'); return; }
    setMethods(prev => [...prev, { ...newMethod, enabled: true }]);
    setNewMethod({ id: '', label: '', icon: '💳', desc: '' });
  };
  const removeMethod = (id: string) => setMethods(prev => prev.filter(m => m.id !== id));

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Apariencia</h1>
        <p className="text-sm text-gray-500 mt-1">Personalizá el logo, colores, slider, footer y métodos de pago</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { id: 'identidad', label: '🎨 Logo' },
          { id: 'colores', label: '🖌️ Colores' },
          { id: 'slider', label: '🖼️ Slider' },
          { id: 'footer', label: '📝 Footer' },
          { id: 'pagos', label: '💳 Pagos' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: IDENTIDAD ── */}
      {tab === 'identidad' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4">Vista previa del logo</h2>
            <div className="bg-[#333333] rounded-lg p-4 flex items-center mb-6">
              {logoImageUrl ? (
                <img src={logoImageUrl} alt={logoText} className="h-9 object-contain" />
              ) : (
                <div className="text-2xl font-black tracking-tight leading-none" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                  <span style={{ color: logoColor }}>{logoAccent}</span>
                  <span className="text-white">{logoText.replace(logoAccent, '')}</span>
                </div>
              )}
            </div>

            {/* Logo imagen */}
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-xs font-semibold text-blue-800 mb-1">🖼️ URL de imagen del logo</label>
              <div className="flex gap-2">
                <input value={logoImageUrl} onChange={e => setLogoImageUrl(e.target.value)} className={inputClass}
                  placeholder="https://... (opcional, reemplaza el logo de texto)" />
                {logoImageUrl && (
                  <button onClick={() => setLogoImageUrl('')} className="shrink-0 text-xs text-red-500 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">✕ Quitar</button>
                )}
              </div>
              <p className="text-[11px] text-blue-600 mt-1">Si se carga imagen, reemplaza el texto. Usá <a href="https://imgur.com" target="_blank" className="underline">Imgur</a> o Cloudinary para hostear la imagen.</p>
            </div>

            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Logo de texto (se usa si no hay imagen)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Texto completo</label>
                <input value={logoText} onChange={e => setLogoText(e.target.value)} className={inputClass} placeholder="ImpoTech" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prefijo con color</label>
                <input value={logoAccent} onChange={e => setLogoAccent(e.target.value)} className={inputClass} placeholder="Impo" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color del acento</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={logoColor} onChange={e => setLogoColor(e.target.value)} className="h-10 w-12 rounded border cursor-pointer" />
                  <input value={logoColor} onChange={e => setLogoColor(e.target.value)} className={inputClass} placeholder="#e8850c" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-2">Favicon (URL)</h2>
            <input value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} className={inputClass} placeholder="https://tudominio.com/favicon.ico" />
          </div>
          <div className="flex justify-end">
            <button onClick={saveIdentidad} disabled={saving} className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Logo'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: COLORES ── */}
      {tab === 'colores' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-1">Paleta de colores del sitio</h2>
            <p className="text-xs text-gray-400 mb-5">Estos colores afectan botones, enlaces, headers y acentos del sitio</p>

            <div className="space-y-5">
              {[
                { label: 'Color primario', sub: 'Botones principales, hover, precio', val: colorPrimary, set: setColorPrimary, preview: 'bg-[#e8850c]' },
                { label: 'Color secundario', sub: 'Header, fondos oscuros, navbar', val: colorSecondary, set: setColorSecondary, preview: 'bg-[#333]' },
                { label: 'Color de acento', sub: 'Badges de oferta, alertas, descuentos', val: colorAccent, set: setColorAccent, preview: 'bg-[#fe3439]' },
                { label: 'Color de fondo', sub: 'Fondo general de la página', val: colorBg, set: setColorBg, preview: 'bg-[#f5f5f5]' },
              ].map(({ label, sub, val, set }) => (
                <div key={label} className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl border border-gray-200 shrink-0 shadow-sm"
                    style={{ backgroundColor: val }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-[11px] text-gray-400">{sub}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={val}
                      onChange={e => set(e.target.value)}
                      className="h-10 w-12 rounded border cursor-pointer border-gray-200"
                    />
                    <input
                      value={val}
                      onChange={e => set(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 font-mono focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-xl border border-gray-100" style={{ backgroundColor: colorBg }}>
              <p className="text-xs text-gray-500 mb-3 font-medium">Vista previa</p>
              <div
                className="text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-block mb-2"
                style={{ backgroundColor: colorPrimary }}
              >
                Botón principal
              </div>
              <div
                className="text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-block mb-2 ml-2"
                style={{ backgroundColor: colorSecondary }}
              >
                Header
              </div>
              <div
                className="text-white text-xs font-semibold px-2 py-0.5 rounded inline-block ml-2"
                style={{ backgroundColor: colorAccent }}
              >
                -25%
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <p className="font-semibold mb-1">ℹ️ Nota</p>
            <p>Los cambios de color se aplican a los elementos dinámicos del sitio (header, botones, badges). Para una personalización completa del CSS, editá el archivo <code className="bg-amber-100 px-1 rounded">globals.css</code>.</p>
          </div>

          <div className="flex justify-end">
            <button onClick={saveColores} disabled={saving} className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Colores'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: SLIDER ── */}
      {tab === 'slider' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-1">Slides del banner principal</h2>
            <p className="text-xs text-gray-400 mb-4">
              {slides.length} slide{slides.length !== 1 ? 's' : ''} configurado{slides.length !== 1 ? 's' : ''}. Arrastrá para reordenar, o usá las flechas.
            </p>

            <div className="space-y-3">
              {slides.map((slide, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                  {/* Preview de imagen */}
                  <div className="w-20 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    {slide.image ? (
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🖼️</div>
                    )}
                  </div>

                  {/* Datos */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      value={slide.alt}
                      onChange={e => setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, alt: e.target.value } : s))}
                      placeholder="Nombre del slide"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#e8850c]"
                    />
                    <input
                      value={slide.image}
                      onChange={e => setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, image: e.target.value } : s))}
                      placeholder="URL de imagen (ej: /banners/mi-banner.jpg)"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#e8850c]"
                    />
                    <input
                      value={slide.link}
                      onChange={e => setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, link: e.target.value } : s))}
                      placeholder="Link al hacer clic (ej: /productos?brand=lexar)"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#e8850c]"
                    />
                  </div>

                  {/* Controles */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => moveSlide(i, -1)} disabled={i === 0} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30">▲</button>
                    <button onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30">▼</button>
                    <button onClick={() => removeSlide(i)} className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agregar slide */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-sm text-gray-800 mb-3">+ Agregar slide</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">Nombre del slide</label>
                <input
                  value={newSlide.alt}
                  onChange={e => setNewSlide(p => ({ ...p, alt: e.target.value }))}
                  className={inputClass} placeholder="Ej: Lexar - Almacenamiento"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">URL de imagen</label>
                <input
                  value={newSlide.image}
                  onChange={e => setNewSlide(p => ({ ...p, image: e.target.value }))}
                  className={inputClass} placeholder="/banners/mi-imagen.jpg o https://..."
                />
                <p className="text-[11px] text-gray-400 mt-0.5">Subí la imagen a <code>/public/banners/</code> o usá una URL externa</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Link al hacer clic</label>
                <input
                  value={newSlide.link}
                  onChange={e => setNewSlide(p => ({ ...p, link: e.target.value }))}
                  className={inputClass} placeholder="/productos?brand=lexar"
                />
              </div>
              <button onClick={addSlide} className="w-full mt-1 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
                + Agregar slide
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveSlider} disabled={saving} className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Slider'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: FOOTER ── */}
      {tab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4">📝 Descripción</h2>
            <textarea value={footerDesc} onChange={e => setFooterDesc(e.target.value)} rows={2} className={inputClass} />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4">📞 Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono 1</label><input value={footerPhone1} onChange={e => setFooterPhone1(e.target.value)} className={inputClass} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono 2</label><input value={footerPhone2} onChange={e => setFooterPhone2(e.target.value)} className={inputClass} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input value={footerEmail} onChange={e => setFooterEmail(e.target.value)} className={inputClass} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Horario de atención</label><input value={footerHours} onChange={e => setFooterHours(e.target.value)} className={inputClass} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Dirección de ventas</label><input value={footerAddress} onChange={e => setFooterAddress(e.target.value)} className={inputClass} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Dirección de service</label><input value={footerService} onChange={e => setFooterService(e.target.value)} className={inputClass} /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-2">🏦 Datos bancarios</h2>
            <textarea value={footerBankInfo} onChange={e => setFooterBankInfo(e.target.value)} rows={3} className={inputClass} placeholder="BROU Cta USD 123456 | SANTANDER..." />
            <p className="text-xs text-gray-400 mt-1">Separar con | (pipe)</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-2">©️ Copyright</h2>
            <input value={footerCopyright} onChange={e => setFooterCopyright(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end">
            <button onClick={saveFooter} disabled={saving} className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Footer'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: PAGOS ── */}
      {tab === 'pagos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-1">Métodos habilitados en el checkout</h2>
            <p className="text-xs text-gray-400 mb-4">Solo los métodos activados aparecerán en el checkout</p>
            <div className="space-y-3">
              {methods.map(m => (
                <div key={m.id} className={`border-2 rounded-xl p-4 transition-all ${m.enabled ? 'border-[#e8850c] bg-orange-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleMethod(m.id)}
                        className={`w-11 h-6 rounded-full transition-all relative ${m.enabled ? 'bg-[#e8850c]' : 'bg-gray-300'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${m.enabled ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="font-medium text-gray-800">{m.icon} {m.label}</span>
                    </div>
                    <button onClick={() => removeMethod(m.id)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div><label className="text-[10px] text-gray-500">Ícono</label><input value={m.icon} onChange={e => updateMethodField(m.id, 'icon', e.target.value)} className="w-full border rounded px-2 py-1 text-sm text-center" maxLength={4} /></div>
                    <div className="col-span-2"><label className="text-[10px] text-gray-500">Descripción</label><input value={m.desc} onChange={e => updateMethodField(m.id, 'desc', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4">+ Agregar método de pago</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className="text-xs text-gray-500">ID único</label><input value={newMethod.id} onChange={e => setNewMethod(p => ({ ...p, id: e.target.value }))} className={inputClass} placeholder="ej: redpagos" /></div>
              <div><label className="text-xs text-gray-500">Nombre</label><input value={newMethod.label} onChange={e => setNewMethod(p => ({ ...p, label: e.target.value }))} className={inputClass} placeholder="ej: Redpagos" /></div>
              <div><label className="text-xs text-gray-500">Ícono</label><input value={newMethod.icon} onChange={e => setNewMethod(p => ({ ...p, icon: e.target.value }))} className={inputClass} maxLength={4} /></div>
              <div><label className="text-xs text-gray-500">Descripción</label><input value={newMethod.desc} onChange={e => setNewMethod(p => ({ ...p, desc: e.target.value }))} className={inputClass} /></div>
            </div>
            <button onClick={addMethod} className="mt-3 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">Agregar</button>
          </div>
          <div className="flex justify-end">
            <button onClick={saveMethods} disabled={saving} className="bg-[#e8850c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Métodos de Pago'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FooterSettings {
  logo_text: string; logo_accent: string; logo_color: string; logo_image_url: string;
  footer_desc: string; footer_phone1: string; footer_phone2: string;
  footer_email: string; footer_hours: string; footer_address: string;
  footer_service: string; footer_bank_info: string; footer_copyright: string;
}

const DEFAULTS: FooterSettings = {
  logo_text: 'ImpoTech', logo_accent: 'Impo', logo_color: '#e8850c', logo_image_url: '',
  footer_desc: 'La tienda de insumos de tecnología con mayor servicio y variedad.',
  footer_phone1: '2929 0990', footer_phone2: '2924 9009',
  footer_email: 'info@impotech.com.uy',
  footer_hours: 'Lun. a Vie. de 9.30 a 12.30 y de 13.30 a 18.30 hs.',
  footer_address: 'Bacigalupi 2084 esq. Lima', footer_service: 'Lima 1668',
  footer_bank_info: 'BROU C. Corriente dólares Nº 1559417-00001 | SANTANDER C. Corriente dólares Nº 005100207330 | SCOTIABANK C. Corriente dólares Nº 2513484200 | ITAÚ C. Corriente dólares Nº 3304980 | HSBC C. Corriente dólares Nº 3298943-2 | PREX Card Nº cuenta dólares 90033713',
  footer_copyright: 'ImpoTech',
};

export default function Footer() {
  const [s, setS] = useState<FooterSettings>(DEFAULTS);

  useEffect(() => {
    fetch('/api/public/settings?keys=logo_image_url,logo_text,logo_accent,logo_color,footer_desc,footer_phone1,footer_phone2,footer_email,footer_hours,footer_address,footer_service,footer_bank_info,footer_copyright')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const merged = { ...DEFAULTS };
          for (const [k, v] of Object.entries(data as Record<string,string>)) {
            if (v) (merged as any)[k] = v;
          }
          setS(merged);
        }
      })
      .catch(() => {});
  }, []);

  const logoRest = s.logo_text.slice(s.logo_accent.length);
  const banks = s.footer_bank_info.split('|').map((b: string) => b.trim()).filter(Boolean);

  return (
    <footer className="bg-[#222222] mt-auto">
      <div className="bg-[#2a2a2a] border-b border-[#333]">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              {s.logo_image_url ? (
                <img src={s.logo_image_url} alt={s.logo_text} className="h-8 object-contain mb-2" />
              ) : (
                <div className="text-xl font-black tracking-tight leading-none mb-2">
                  <span style={{ color: s.logo_color }}>{s.logo_accent}</span>
                  <span className="text-white text-lg font-bold">{logoRest}</span>
                </div>
              )}
              <p className="text-[13px] text-gray-400 leading-relaxed">{s.footer_desc}</p>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-3 uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-2 text-[13px] text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#e8850c] mt-0.5">📞</span>
                  <div>
                    {s.footer_phone1 && <a href={`tel:+598${s.footer_phone1.replace(/\D/g,'')}`} className="hover:text-white transition-colors block">{s.footer_phone1}</a>}
                    {s.footer_phone2 && <a href={`tel:+598${s.footer_phone2.replace(/\D/g,'')}`} className="hover:text-white transition-colors block">{s.footer_phone2}</a>}
                  </div>
                </li>
                {s.footer_email && <li className="flex items-center gap-2"><span className="text-[#e8850c]">📧</span><a href={`mailto:${s.footer_email}`} className="hover:text-white transition-colors">{s.footer_email}</a></li>}
                {s.footer_hours && <li className="flex items-start gap-2"><span className="text-[#e8850c] mt-0.5">🕐</span><span>{s.footer_hours}</span></li>}
                {(s.footer_address || s.footer_service) && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#e8850c] mt-0.5">📍</span>
                    <div>
                      {s.footer_address && <span className="block"><b className="text-gray-300">Ventas</b> {s.footer_address}</span>}
                      {s.footer_service && <span className="block"><b className="text-gray-300">Service</b> {s.footer_service}</span>}
                    </div>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-3 uppercase tracking-wider">Nosotros</h4>
              <ul className="space-y-1.5 text-[13px] text-gray-400">
                {[['Compañía','/empresa'],['Instalaciones','/instalaciones'],['Noticias','/noticias'],['Servicios','/servicios'],['Trabaja con nosotros','/trabaja-con-nosotros'],['Ubicación','/ubicacion'],['Contacto','/contacto']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-3 uppercase tracking-wider">Tienda</h4>
              <ul className="space-y-1.5 text-[13px] text-gray-400 mb-4">
                {[['Recién arribados','/productos?new=true'],['Arribando (Reservas)','/productos?category=arribando'],['Categorías','/productos'],['Combos','/productos?category=combos'],['Marcas','/marcas']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-2 uppercase tracking-wider">Ayuda</h4>
              <ul className="space-y-1.5 text-[13px] text-gray-400">
                <li><Link href="/productos?category=outlet" className="text-[#d43b2f] hover:text-white transition-colors font-semibold">🏷️ OUTLET</Link></li>
                <li><Link href="/garantia" className="hover:text-white transition-colors">Políticas de garantía</Link></li>
                <li><Link href="/politicas-de-ventas" className="hover:text-white transition-colors">Políticas de ventas</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-4">
        <p className="text-[11px] text-gray-500 text-center mb-3">Los precios son en dólares americanos y no incluyen IVA.</p>
        {banks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] text-gray-600 mb-3">
            {banks.map((bank: string, i: number) => {
              const sp = bank.indexOf(' ');
              const name = sp > -1 ? bank.slice(0, sp) : bank;
              const rest = sp > -1 ? bank.slice(sp) : '';
              return <span key={i}><b className="text-gray-500">{name}</b>{rest}</span>;
            })}
          </div>
        )}
        <div className="text-center text-[11px] text-gray-600">
          © Copyright {new Date().getFullYear()}{' '}
          <span style={{ color: s.logo_color }}>{s.logo_accent}</span>
          <span className="text-gray-400">{logoRest}</span>
        </div>
      </div>
    </footer>
  );
}

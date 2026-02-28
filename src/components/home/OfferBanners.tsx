import Link from 'next/link';

const banners = [
  {
    title: 'Gaming Pro',
    subtitle: 'Equipos armados listos para jugar',
    cta: 'Ver combos',
    href: '/productos?category=gaming',
    accent: 'from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]',
  },
  {
    title: 'Empresas & PyMEs',
    subtitle: 'Infraestructura, redes y servidores',
    cta: 'Consultar',
    href: '/productos?category=conectividad',
    accent: 'from-[#0f172a] via-[#1e293b] to-[#0f172a]',
  },
  {
    title: 'Outlet Tech',
    subtitle: 'Ofertas limitadas con stock real',
    cta: 'Ver outlet',
    href: '/productos?category=outlet',
    accent: 'from-[#3f1d0b] via-[#7c2d12] to-[#3f1d0b]',
  },
];

export default function OfferBanners() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <Link
              key={banner.title}
              href={banner.href}
              className={`relative overflow-hidden rounded border border-[#2f2f2f] bg-gradient-to-r ${banner.accent} p-6 hover:border-[#4b5563] transition-colors`}
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Especial</p>
                <h3 className="text-xl font-bold text-white">{banner.title}</h3>
                <p className="text-sm text-white/70">{banner.subtitle}</p>
              </div>
              <span className="inline-flex mt-4 text-xs font-semibold text-[#30acd5]">
                {banner.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

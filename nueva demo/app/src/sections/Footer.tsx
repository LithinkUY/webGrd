import { Phone, Mail, Clock, MapPin } from 'lucide-react'

const Footer = () => {
  const nosotrosLinks = [
    { name: 'Compañía', href: '/cdr-empresa/' },
    { name: 'Instalaciones', href: '/instalaciones/' },
    { name: 'Noticias', href: '/noticias/' },
    { name: 'Servicios', href: '/servicios/' },
    { name: 'Trabaja con nosotros', href: '/trabaja-con-nosotros/' },
    { name: 'Ubicación', href: '/ubicacion/' },
    { name: 'Contacto', href: '/contacto/' },
  ]

  const tiendaLinks = [
    { name: 'Recién arribados', href: '/recien-arribados/' },
    { name: 'Arribando (Reservas)', href: '/arribando/' },
    { name: 'Categorías', href: '/categorias/' },
    { name: 'Combos', href: '/combos/' },
    { name: 'Marcas', href: '/marcas-y-representaciones/' },
    { name: 'OUTLET', href: '/outlet/' },
  ]

  const ayudaLinks = [
    { name: 'Políticas de garantía', href: '/politicas-de-garantia/' },
    { name: 'Políticas de ventas', href: '/politicas-de-ventas/' },
  ]

  const bankAccounts = [
    { bank: 'BROU', account: 'C. Corriente dólares Nº 1559417-00001' },
    { bank: 'SANTANDER', account: 'C. Corriente dólares Nº 005100207330 (sucursal 84)' },
    { bank: 'SCOTIABANK', account: 'C. Corriente dólares Nº 2513484200 (sucursal 002 o Aguada)' },
    { bank: 'ITAÚ', account: 'C. Corriente dólares Nº 3304980' },
    { bank: 'HSBC', account: 'C. Corriente dólares Nº 3298943-2' },
    { bank: 'PREX Card', account: 'Nº de cuenta dólares 90033713' },
  ]

  return (
    <footer className="bg-[#2d2d2d] text-white">
      {/* Main Footer */}
      <div className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Contact Info */}
          <div>
            <div className="mb-6">
              <span className="text-2xl font-bold">CDR</span>
            </div>
            <div className="space-y-3">
              <a
                href="tel:29290990"
                className="flex items-center gap-2 text-[#00d4aa] hover:underline"
              >
                <Phone className="w-4 h-4" />
                <span>Llamar 2929 0990*</span>
              </a>
              <a
                href="tel:29249009"
                className="flex items-center gap-2 text-[#00d4aa] hover:underline"
              >
                <Phone className="w-4 h-4" />
                <span>Llamar 2924 9009</span>
              </a>
              <a
                href="mailto:ventas@cdrmedios.com"
                className="flex items-center gap-2 text-[#00d4aa] hover:underline"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
              <div className="flex items-start gap-2 text-gray-300 text-sm">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Lun. a Vie. de 9.30 a 12.30 y de 13.30 a 18.30 hs.</span>
              </div>
              <div className="flex items-start gap-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[#00d4aa]">Ventas</span> Bacigalupi 2084 esq. Lima
                  <br />
                  <span className="text-[#00d4aa]">Service</span> Lima 1668
                </div>
              </div>
            </div>
          </div>

          {/* Nosotros */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Nosotros</h3>
            <ul className="space-y-2">
              {nosotrosLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tienda</h3>
            <ul className="space-y-2">
              {tiendaLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className={`text-sm transition-colors ${
                      link.name === 'OUTLET'
                        ? 'text-amber-400 hover:text-amber-300 font-medium'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ayuda</h3>
            <ul className="space-y-2">
              {ayudaLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="border-t border-gray-700">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <p className="text-gray-400 text-sm mb-3">
            Los precios son en dólares americanos y no incluyen IVA.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs text-gray-500">
            {bankAccounts.map((item) => (
              <div key={item.bank}>
                <span className="font-semibold">{item.bank}</span>
                <br />
                {item.account}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-gray-500 text-sm">
            © Copyright 2026 CDR Medios
          </p>
          <a
            href="http://www.sublimesolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            By SUBLIMESOLUTIONS.com
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer

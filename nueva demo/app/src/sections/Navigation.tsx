import { useState } from 'react'
import { 
  Volume2, 
  Monitor, 
  Laptop, 
  Backpack, 
  Smartphone, 
  Cpu, 
  Gamepad2, 
  Wifi, 
  Printer, 
  Disc, 
  Battery, 
  Home, 
  Package,
  Truck
} from 'lucide-react'

interface SubCategory {
  name: string
  href: string
}

interface Category {
  name: string
  icon: React.ElementType
  href: string
  subcategories: SubCategory[]
}

const Navigation = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  const categories: Category[] = [
    { 
      name: 'Audio Imagen', 
      icon: Volume2, 
      href: '/catalogo/audio-imagen/',
      subcategories: [
        { name: 'Accesorios para auto', href: '/catalogo/audio-imagen/accesorios-para-auto/' },
        { name: 'Drones', href: '/catalogo/audio-imagen/drones/' },
        { name: 'Fotografía digital', href: '/catalogo/audio-imagen/fotografia-digital/' },
        { name: 'Proyectores multimedia y pantallas', href: '/catalogo/audio-imagen/proyectores/' },
        { name: 'Sistemas de vigilancia', href: '/catalogo/audio-imagen/sistemas-de-vigilancia/' },
        { name: 'Soportes para tv / monitor / proyector', href: '/catalogo/audio-imagen/soportes/' },
        { name: 'Tv lcd / led y accesorios', href: '/catalogo/audio-imagen/tv-led/' },
        { name: 'Audífonos y micrófonos', href: '/catalogo/audio-imagen/audifonos/' },
        { name: 'Parlantes', href: '/catalogo/audio-imagen/parlantes/' },
        { name: 'Monitores', href: '/catalogo/audio-imagen/monitores/' },
      ]
    },
    { 
      name: 'Gabinetes Accesorios', 
      icon: Monitor, 
      href: '/catalogo/gabinetes-accesorios/',
      subcategories: [
        { name: 'Gabinetes ATX', href: '/catalogo/gabinetes-accesorios/gabinetes-atx/' },
        { name: 'Gabinetes Micro ATX', href: '/catalogo/gabinetes-accesorios/gabinetes-micro-atx/' },
        { name: 'Fuentes de poder', href: '/catalogo/gabinetes-accesorios/fuentes/' },
        { name: 'Teclados', href: '/catalogo/gabinetes-accesorios/teclados/' },
        { name: 'Mouse', href: '/catalogo/gabinetes-accesorios/mouse/' },
        { name: 'Mousepads', href: '/catalogo/gabinetes-accesorios/mousepads/' },
        { name: 'Webcams', href: '/catalogo/gabinetes-accesorios/webcams/' },
        { name: 'Auriculares', href: '/catalogo/gabinetes-accesorios/auriculares/' },
      ]
    },
    { 
      name: 'Notebook PC Tablet', 
      icon: Laptop, 
      href: '/catalogo/notebook-pc-tablet/',
      subcategories: [
        { name: 'Notebooks', href: '/catalogo/notebook-pc-tablet/notebooks/' },
        { name: 'Tablets', href: '/catalogo/notebook-pc-tablet/tablets/' },
        { name: 'PC de escritorio', href: '/catalogo/notebook-pc-tablet/pc-escritorio/' },
        { name: 'All in One', href: '/catalogo/notebook-pc-tablet/all-in-one/' },
        { name: 'Mini PC', href: '/catalogo/notebook-pc-tablet/mini-pc/' },
        { name: 'Accesorios notebooks', href: '/catalogo/notebook-pc-tablet/accesorios/' },
        { name: 'Bolsos y mochilas', href: '/catalogo/notebook-pc-tablet/bolsos/' },
      ]
    },
    { 
      name: 'Portabilidad', 
      icon: Backpack, 
      href: '/catalogo/portabilidad/',
      subcategories: [
        { name: 'Power banks', href: '/catalogo/portabilidad/power-banks/' },
        { name: 'Cables y adaptadores', href: '/catalogo/portabilidad/cables/' },
        { name: 'Cargadores', href: '/catalogo/portabilidad/cargadores/' },
        { name: 'Hubs USB', href: '/catalogo/portabilidad/hubs-usb/' },
        { name: 'Soportes', href: '/catalogo/portabilidad/soportes/' },
      ]
    },
    { 
      name: 'Telefonía Smartwatch', 
      icon: Smartphone, 
      href: '/catalogo/telefonia-smartwatch/',
      subcategories: [
        { name: 'Celulares', href: '/catalogo/telefonia-smartwatch/celulares/' },
        { name: 'Smartwatches', href: '/catalogo/telefonia-smartwatch/smartwatches/' },
        { name: 'Fundas', href: '/catalogo/telefonia-smartwatch/fundas/' },
        { name: 'Protectores', href: '/catalogo/telefonia-smartwatch/protectores/' },
        { name: 'Cargadores', href: '/catalogo/telefonia-smartwatch/cargadores/' },
        { name: 'Accesorios', href: '/catalogo/telefonia-smartwatch/accesorios/' },
      ]
    },
    { 
      name: 'Hardware Accesorios', 
      icon: Cpu, 
      href: '/catalogo/hardware-accesorios/',
      subcategories: [
        { name: 'Motherboards', href: '/catalogo/hardware-accesorios/motherboards/' },
        { name: 'Procesadores', href: '/catalogo/hardware-accesorios/procesadores/' },
        { name: 'Memorias RAM', href: '/catalogo/hardware-accesorios/memorias-ram/' },
        { name: 'Tarjetas de video', href: '/catalogo/hardware-accesorios/tarjetas-de-video/' },
        { name: 'Discos SSD', href: '/catalogo/hardware-accesorios/discos-ssd/' },
        { name: 'Discos HDD', href: '/catalogo/hardware-accesorios/discos-hdd/' },
        { name: 'Coolers', href: '/catalogo/hardware-accesorios/coolers/' },
        { name: 'Pendrives', href: '/catalogo/hardware-accesorios/pendrives/' },
        { name: 'Memorias SD', href: '/catalogo/hardware-accesorios/memorias-sd/' },
      ]
    },
    { 
      name: 'Gaming', 
      icon: Gamepad2, 
      href: '/catalogo/gaming/',
      subcategories: [
        { name: 'Notebooks gamer', href: '/catalogo/gaming/notebooks-gamer/' },
        { name: 'Monitores gamer', href: '/catalogo/gaming/monitores-gamer/' },
        { name: 'Teclados gamer', href: '/catalogo/gaming/teclados-gamer/' },
        { name: 'Mouse gamer', href: '/catalogo/gaming/mouse-gamer/' },
        { name: 'Auriculares gamer', href: '/catalogo/gaming/auriculares-gamer/' },
        { name: 'Sillas gamer', href: '/catalogo/gaming/sillas-gamer/' },
        { name: 'Accesorios gamer', href: '/catalogo/gaming/accesorios-gamer/' },
      ]
    },
    { 
      name: 'Conectividad', 
      icon: Wifi, 
      href: '/catalogo/conectividad/',
      subcategories: [
        { name: 'Routers', href: '/catalogo/conectividad/routers/' },
        { name: 'Switches', href: '/catalogo/conectividad/switches/' },
        { name: 'Access points', href: '/catalogo/conectividad/access-points/' },
        { name: 'Placas de red', href: '/catalogo/conectividad/placas-de-red/' },
        { name: 'Cables de red', href: '/catalogo/conectividad/cables-de-red/' },
        { name: 'Adaptadores WiFi', href: '/catalogo/conectividad/adaptadores-wifi/' },
      ]
    },
    { 
      name: 'Impresión', 
      icon: Printer, 
      href: '/catalogo/impresion/',
      subcategories: [
        { name: 'Impresoras láser', href: '/catalogo/impresion/impresoras-laser/' },
        { name: 'Impresoras tinta', href: '/catalogo/impresion/impresoras-tinta/' },
        { name: 'Impresoras 3D', href: '/catalogo/impresion/impresoras-3d/' },
        { name: 'Cartuchos', href: '/catalogo/impresion/cartuchos/' },
        { name: 'Tóners', href: '/catalogo/impresion/toners/' },
        { name: 'Papel', href: '/catalogo/impresion/papel/' },
      ]
    },
    { 
      name: 'CD DVD', 
      icon: Disc, 
      href: '/catalogo/cd-dvd/',
      subcategories: [
        { name: 'CD-R', href: '/catalogo/cd-dvd/cd-r/' },
        { name: 'DVD-R', href: '/catalogo/cd-dvd/dvd-r/' },
        { name: 'DVD+R', href: '/catalogo/cd-dvd/dvd+r/' },
        { name: 'Blu-ray', href: '/catalogo/cd-dvd/blu-ray/' },
        { name: 'Estuches', href: '/catalogo/cd-dvd/estuches/' },
      ]
    },
    { 
      name: 'Energía', 
      icon: Battery, 
      href: '/catalogo/energia/',
      subcategories: [
        { name: 'UPS', href: '/catalogo/energia/ups/' },
        { name: 'Estabilizadores', href: '/catalogo/energia/estabilizadores/' },
        { name: 'Regletas', href: '/catalogo/energia/regletas/' },
        { name: 'Baterías', href: '/catalogo/energia/baterias/' },
        { name: 'Cargadores', href: '/catalogo/energia/cargadores/' },
      ]
    },
    { 
      name: 'Hogar', 
      icon: Home, 
      href: '/catalogo/hogar/',
      subcategories: [
        { name: 'Smart home', href: '/catalogo/hogar/smart-home/' },
        { name: 'Iluminación LED', href: '/catalogo/hogar/iluminacion-led/' },
        { name: 'Climatización', href: '/catalogo/hogar/climatizacion/' },
        { name: 'Electrodomésticos', href: '/catalogo/hogar/electrodomesticos/' },
      ]
    },
    { 
      name: 'Arribados', 
      icon: Package, 
      href: '/catalogo/arribados/',
      subcategories: [
        { name: 'Últimos arribos', href: '/catalogo/arribados/ultimos/' },
        { name: 'Ofertas', href: '/catalogo/arribados/ofertas/' },
        { name: 'Destacados', href: '/catalogo/arribados/destacados/' },
      ]
    },
    { 
      name: 'Arribando', 
      icon: Truck, 
      href: '/arribando/',
      subcategories: [
        { name: 'Próximos arribos', href: '/arribando/proximos/' },
        { name: 'Reservas', href: '/arribando/reservas/' },
        { name: 'Preventa', href: '/arribando/preventa/' },
      ]
    },
  ]

  return (
    <nav className="bg-[#2d2d2d] text-white sticky top-[60px] z-40">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {categories.map((category, index) => {
            const Icon = category.icon
            const isActive = activeCategory === index
            
            return (
              <div
                key={index}
                className="relative group"
                onMouseEnter={() => setActiveCategory(index)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <a
                  href={category.href}
                  className={`flex flex-col items-center justify-center min-w-[90px] px-3 py-3 transition-colors duration-150 ${
                    isActive ? 'bg-[#1a5f4a]' : 'hover:bg-[#3d3d3d]'
                  }`}
                >
                  <Icon className={`w-7 h-7 mb-1 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`} />
                  <span className={`text-[11px] text-center leading-tight transition-colors whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {category.name}
                  </span>
                </a>

                {/* Dropdown Menu */}
                {isActive && category.subcategories.length > 0 && (
                  <div className="absolute top-full left-0 z-50 animate-fadeIn">
                    {/* Arrow pointing up */}
                    <div className="absolute -top-2 left-8 w-4 h-4 bg-[#1a5f4a] transform rotate-45 z-0"></div>
                    
                    <div className="relative bg-[#1a5f4a] rounded-b-lg shadow-2xl min-w-[500px] overflow-hidden">
                      <div className="flex">
                        {/* Subcategories List */}
                        <div className="flex-1 p-4">
                          <ul className="space-y-1">
                            {category.subcategories.map((sub, subIndex) => (
                              <li key={subIndex}>
                                <a
                                  href={sub.href}
                                  className="block py-2 px-3 text-sm text-white hover:bg-white/10 rounded transition-colors"
                                >
                                  {sub.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Icon/Image Section */}
                        <div className="w-40 bg-[#145a45] flex items-center justify-center p-6">
                          <div className="text-center">
                            <Icon className="w-20 h-20 text-white/80 mx-auto mb-2" strokeWidth={1} />
                            <span className="text-xs text-white/60">{category.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navigation

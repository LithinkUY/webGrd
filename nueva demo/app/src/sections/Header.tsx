import { useState } from 'react'
import { Search, ShoppingCart, User, Heart, ChevronDown } from 'lucide-react'

const Header = () => {
  const [searchCategory, setSearchCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)

  const categories = [
    { value: 'all', label: 'Buscar en categoría' },
    { value: 'audio', label: 'Audio Imagen' },
    { value: 'gabinetes', label: 'Gabinetes Accesorios' },
    { value: 'notebook', label: 'Notebook PC Tablet' },
    { value: 'portabilidad', label: 'Portabilidad' },
    { value: 'telefonia', label: 'Telefonía Smartwatch' },
    { value: 'hardware', label: 'Hardware Accesorios' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'conectividad', label: 'Conectividad' },
    { value: 'impresion', label: 'Impresión' },
    { value: 'cddvd', label: 'CD DVD' },
    { value: 'energia', label: 'Energía' },
    { value: 'hogar', label: 'Hogar' },
    { value: 'outlet', label: 'Outlet' },
    { value: 'arribados', label: 'Arribados' },
    { value: 'combos', label: 'Combos' },
  ]

  return (
    <>
      <header className="bg-[#1a1a1a] text-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-[60px] gap-4">
            {/* Logo */}
            <a href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold tracking-tight">CDR</span>
            </a>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center bg-white rounded-full overflow-hidden">
                <div className="relative">
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="appearance-none bg-[#4a4a4a] text-white text-sm px-4 py-2.5 pr-8 border-r border-gray-600 cursor-pointer focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
                </div>
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="flex-1 px-4 py-2.5 text-gray-800 text-sm focus:outline-none"
                  />
                  <button className="px-4 py-2.5 text-gray-500 hover:text-gray-700 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Favorites */}
              <a
                href="/favoritos"
                className="hidden md:flex items-center gap-1 text-sm hover:text-gray-300 transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span className="hidden lg:inline">Favoritos</span>
              </a>

              {/* Login */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1 text-sm hover:text-gray-300 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden lg:inline">Ingresar</span>
              </button>

              {/* Cart */}
              <a
                href="/carrito"
                className="flex items-center gap-2 bg-[#333] hover:bg-[#444] px-3 py-2 rounded transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-[#00d4aa] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    0
                  </span>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-gray-400">USD</div>
                  <div className="text-sm font-medium">0</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Iniciar Sesión</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="mr-2" />
                <label htmlFor="remember" className="text-sm text-gray-600">Recordar datos</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#4a4a4a] hover:bg-[#333] text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                INGRESAR
              </button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <a href="#" className="block text-sm text-[#00d4aa] hover:underline">Olvidé mi clave</a>
              <a href="#" className="block text-sm text-[#00d4aa] hover:underline">Registro</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header

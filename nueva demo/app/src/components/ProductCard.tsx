import { ShoppingCart, Heart } from 'lucide-react'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  description: string
  image: string
  sku: string
}

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50 p-4 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        />
        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center transition-colors hover:bg-gray-100"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px]">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
          {product.description}
        </p>
        <p className="text-sm text-gray-600 mt-2 italic">
          Regístrate para ver $ precios.
        </p>

        {/* Buy Button */}
        <button className="w-full mt-3 bg-[#9e9e9e] hover:bg-[#757575] text-white text-sm font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors">
          <ShoppingCart className="w-4 h-4" />
          Comprar
        </button>

        {/* SKU */}
        <p className="text-center text-xs text-gray-400 mt-2 font-mono">
          {product.sku}
        </p>
      </div>
    </div>
  )
}

export default ProductCard

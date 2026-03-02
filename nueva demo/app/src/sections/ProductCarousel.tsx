import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'

interface Product {
  id: string
  name: string
  description: string
  image: string
  sku: string
}

interface ProductCarouselProps {
  title: string
  products: Product[]
  id: string
  transparentBg?: boolean
}

const ProductCarousel = ({ title, products, id, transparentBg = false }: ProductCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollability)
      checkScrollability()
      return () => container.removeEventListener('scroll', checkScrollability)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section id={id} className={`py-6 px-4 max-w-[1400px] mx-auto ${transparentBg ? '' : ''}`}>
      {/* Category Header */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center bg-[#4a4a4a] rounded-full overflow-hidden shadow-lg">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`px-4 py-2 text-white transition-colors ${
              canScrollLeft ? 'hover:bg-[#5a5a5a]' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="px-6 py-2 text-white font-semibold text-base whitespace-nowrap">
            {title}
          </h2>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`px-4 py-2 text-white transition-colors ${
              canScrollRight ? 'hover:bg-[#5a5a5a]' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(16.666%-14px)] snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProductCarousel

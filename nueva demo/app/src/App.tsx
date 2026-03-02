import { useState, useEffect } from 'react'
import './App.css'
import Header from './sections/Header'
import Navigation from './sections/Navigation'
import HeroCarousel from './sections/HeroCarousel'
import ProductCarousel from './sections/ProductCarousel'
import Footer from './sections/Footer'
import { asrockProducts, lexarProducts, bequietProducts, notebookProducts } from './data/products'

function App() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <Navigation />
      
      {/* Hero Section - with negative margin to pass behind first product section */}
      <div className="relative">
        <HeroCarousel />
        
        {/* First Product Section - overlaps hero with negative margin */}
        <div className="relative z-10 -mt-16">
          <ProductCarousel 
            title="Nuevo arribo de ASRock !" 
            products={asrockProducts}
            id="asrock"
            transparentBg={true}
          />
        </div>
      </div>
      
      {/* Other Product Sections */}
      <ProductCarousel 
        title="Nuevo arribo de Lexar" 
        products={lexarProducts}
        id="lexar"
      />
      <ProductCarousel 
        title="Toda la linea be quiet !" 
        products={bequietProducts}
        id="bequiet"
      />
      <ProductCarousel 
        title="Notebooks GAMER" 
        products={notebookProducts}
        id="notebooks"
      />
      
      <Footer />
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#4a4a4a] hover:bg-[#333] text-white rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 z-50"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default App

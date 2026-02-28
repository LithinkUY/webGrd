import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import BrandsBar from '@/components/home/BrandsBar';

export default function Home() {
  return (
    <>
      {/* Banner slider corre detrás de la barra de categorías y los productos */}
      <div className="relative">
        {/* Banner backdrop — ocupa todo el alto, queda detrás */}
        <div className="absolute inset-0 z-0">
          <HeroBanner />
          {/* Degradé que funde el banner hacia el fondo gris */}
          <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[#e8e8e8] to-transparent" />
        </div>

        {/* Contenido que va encima del banner */}
        <div className="relative z-10">
          <CategoryGrid />
          {/* Spacer transparente para que se vea el banner detrás */}
          <div className="h-[280px] md:h-[340px] lg:h-[400px]" />
        </div>
      </div>

      {/* Productos y demás sobre fondo normal */}
      <FeaturedProducts />
      <BrandsBar />
    </>
  );
}

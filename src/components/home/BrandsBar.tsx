import Link from 'next/link';

/* Brands bar — light theme */
const brands = [
  'HP', 'Lenovo', 'Dell', 'Samsung', 'LG', 'Logitech', 'Kingston',
  'TP-Link', 'Epson', 'AMD', 'Intel', 'MSI', 'Asrock', 'Gigabyte',
  'Corsair', 'Western Digital', 'Seagate', 'BenQ', 'Xiaomi', 'Deepcool',
  'Mikrotik', 'Ubiquiti', 'Lexar', 'Bambu Lab', 'Biostar',
];

export default function BrandsBar() {
  return (
    <section className="py-5 bg-white border-y border-[#ddd]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider">Marcas y Representaciones</h3>
          <Link href="/marcas" className="text-[12px] text-[#e8850c] hover:text-[#333] transition-colors">ver todas →</Link>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`/productos?brand=${encodeURIComponent(brand)}`}
              className="text-[#666] hover:text-[#e8850c] font-semibold text-[13px] transition-colors"
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

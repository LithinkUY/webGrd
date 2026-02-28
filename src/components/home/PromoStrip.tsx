import Link from 'next/link';

const promos = [
  {
    title: 'Cuotas sin interés',
    description: '3 y 6 cuotas en productos seleccionados',
    tag: 'Financiación',
  },
  {
    title: 'Envíos express',
    description: 'Recibí tu compra en 24/48 hs',
    tag: 'Logística',
  },
  {
    title: 'Atención especializada',
    description: 'Soporte técnico y asesoría',
    tag: 'Soporte',
  },
  {
    title: 'Retirá en tienda',
    description: 'Pickup gratis en sucursal',
    tag: 'Pick-up',
  },
];

export default function PromoStrip() {
  return (
    <section className="bg-[#1f1f1f] border-y border-[#2b2b2b]">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {promos.map((promo) => (
            <div
              key={promo.title}
              className="rounded border border-[#2f2f2f] bg-[#252525] p-4 hover:border-[#3a3a3a] transition-colors"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#30acd5]">{promo.tag}</p>
              <h3 className="text-sm font-semibold text-white mt-1">{promo.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{promo.description}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-3">
          <Link href="/productos" className="text-xs text-gray-300 hover:text-white transition-colors">
            Ver promociones
          </Link>
        </div>
      </div>
    </section>
  );
}

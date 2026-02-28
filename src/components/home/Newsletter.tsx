export default function Newsletter() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="rounded border border-[#2f2f2f] bg-[#232323] p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#30acd5]">Newsletter</p>
              <h3 className="text-2xl font-bold text-white mt-2">Novedades, promos y lanzamientos</h3>
              <p className="text-sm text-gray-400 mt-2">
                Suscribite para recibir ofertas exclusivas y alertas de stock.
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full sm:w-72 bg-[#1b1b1b] text-white border border-[#333] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-[#30acd5]"
              />
              <button
                type="submit"
                className="bg-[#30acd5] text-white font-semibold px-6 py-2.5 rounded hover:bg-[#2899bf] transition-colors"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

const services = [
  {
    title: 'Envíos a todo el país',
    description: 'Seguimiento en tiempo real',
    icon: '🚚',
  },
  {
    title: 'Compra segura',
    description: 'Pagos protegidos y encriptados',
    icon: '🔒',
  },
  {
    title: 'Soporte técnico',
    description: 'Asesoramiento especializado',
    icon: '💬',
  },
  {
    title: 'Garantía oficial',
    description: 'Productos originales con respaldo',
    icon: '✅',
  },
];

export default function ServiceHighlights() {
  return (
    <section className="py-10 bg-[#1c1c1c] border-y border-[#2b2b2b]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="flex items-start gap-4 p-5 bg-[#232323] border border-[#2f2f2f] rounded"
            >
              <span className="text-2xl">{service.icon}</span>
              <div>
                <h3 className="font-semibold text-white text-sm">{service.title}</h3>
                <p className="text-xs text-gray-500">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

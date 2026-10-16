export default function Trayectoria() {
  const pilares = [
    {
      numero: "01",
      titulo: "Criterio y Análisis de Sistemas",
      detalle:
        "Antes de escribir código, se analiza la lógica del negocio. Esto asegura que la página o el sistema responda a una necesidad comercial real, ahorrando tiempo y evitando retrabajos.",
    },
    {
      numero: "02",
      titulo: "Estructuras Robustas y Seguras",
      detalle:
        "Cinco décadas de experiencia en desarrollo computarizado garantizan bases de datos ordenadas, código limpio y soluciones pensadas para operar sin fallas a largo plazo.",
    },
    {
      numero: "03",
      titulo: "Trato Directo y Transparente",
      detalle:
        "Comunicación clara y sin rodeos técnicos innecesarios. Usted trata directamente con el analista responsable del proyecto desde la concepción hasta la entrega y el soporte.",
    },
  ];

  return (
    <section id="trayectoria" className="py-24 bg-slate-950 border-t border-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Columna izquierda: Resumen de experiencia */}
          <div className="lg:col-span-5">
            <span className="text-xs uppercase tracking-widest text-blue-400 font-bold block mb-3">
              Respaldo & Confianza
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-6">
              Más de 50 años de trayectoria técnica al servicio de su proyecto
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm mb-6">
              En un entorno digital saturado de soluciones superficiales, el verdadero valor de un sistema radica en su estabilidad, orden lógico y adaptabilidad a la operación diaria de una empresa.
            </p>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs leading-relaxed">
              <strong className="text-blue-400 block mb-1">Compromiso profesional:</strong>
              Cada desarrollo se construye con estándares rigurosos de ingeniería de software, garantizando que su inversión rinda frutos hoy y pueda escalar mañana.
            </div>
          </div>

          {/* Columna derecha: Los 3 pilares */}
          <div className="lg:col-span-7 space-y-6">
            {pilares.map((pilar, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 flex gap-6 hover:border-slate-700 transition-colors"
              >
                <div className="text-3xl font-black text-blue-500/40 select-none">
                  {pilar.numero}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {pilar.titulo}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {pilar.detalle}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
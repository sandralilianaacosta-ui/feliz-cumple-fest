const milestones = [
  { year: '1996', title: 'El día que llegaste al mundo 👶', desc: 'Un día soleado de mayo, nació una estrella.' },
  { year: '2002', title: 'Primeros pasos en la escuela 📚', desc: 'Siempre curiosa, siempre con una sonrisa.' },
  { year: '2010', title: 'Esos viajes inolvidables ✈️', desc: 'Cada destino, una nueva historia para contar.' },
  { year: '2018', title: 'Logros profesionales 🏆', desc: 'Demostrando que todo es posible con esfuerzo.' },
  { year: '2026', title: '¡30 años de pura magia! 🎉', desc: 'Y lo mejor está por venir...' },
];

export default function Timeline() {
  return (
    <section id="recuerdos" className="py-16 px-4 bg-card">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-2">🕰️ Momentos Especiales</h2>
        <p className="text-muted-foreground text-center mb-10">Un recorrido por los hitos más queridos</p>

        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 -translate-x-1/2" />
          {milestones.map((m, i) => (
            <div key={i} className={`relative flex items-start mb-10 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
              <div className="absolute left-4 sm:left-1/2 w-4 h-4 rounded-full bg-primary -translate-x-1/2 mt-1 z-10" />
              <div className={`ml-10 sm:ml-0 sm:w-[45%] ${i % 2 === 0 ? 'sm:pr-8 sm:text-right' : 'sm:pl-8'}`}>
                <span className="text-sm font-bold text-primary">{m.year}</span>
                <h3 className="font-heading text-lg font-semibold mt-1">{m.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

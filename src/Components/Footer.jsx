export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 py-10 text-white text-xs">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-sm tracking-tight text-white">
            LHBO<span className="text-blue-500">.</span> Sistemas
          </span>
          <p className="text-slate-400 mt-1">
            Consultoría y desarrollo computarizado con más de 50 años de trayectoria.
          </p>
        </div>

        <div className="text-slate-500 text-center sm:text-right">
          © {new Date().getFullYear()} LHBO Sistemas. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
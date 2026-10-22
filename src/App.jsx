import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import Servicios from "./Components/Servicios";
import Soluciones from "./Components/Soluciones";
import Trayectoria from "./Components/Trayectoria";
import Contacto from "./Components/Contacto";
import Footer from "./Components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <Servicios />
        <Soluciones />
        <Trayectoria />
        <Contacto />
      </main>
      <Footer />
    </div>
  );
}

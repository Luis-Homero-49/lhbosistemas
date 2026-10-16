import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import Servicios from "./Components/Servicios";
import Trayectoria from "./Components/Trayectoria";
import Contacto from "./Components/Contacto";
import Footer from "./Components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main>
        <Hero />
        <Servicios />
        <Trayectoria />
        <Contacto />
      </main>
      <Footer />
    </div>
  );
}
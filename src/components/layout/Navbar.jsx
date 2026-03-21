import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-rumbero-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo Text/Icon */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Logo Escuadrón Rumbero" 
            className="h-16 w-auto object-contain hover:scale-105 transition-transform" 
          />
        </Link>
        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-8">
          <Link to="/" className="text-slate-100 hover:text-rumbero-red transition-colors text-sm font-bold uppercase tracking-widest">Inicio</Link>
          <Link to="/about" className="text-slate-400 hover:text-rumbero-red transition-colors text-sm font-bold uppercase tracking-widest">Sobre Nosotros</Link>
          <Link to="/training" className="text-slate-400 hover:text-rumbero-red transition-colors text-sm font-bold uppercase tracking-widest">Entrenamientos</Link>
          <Link to="/events" className="text-slate-400 hover:text-rumbero-red transition-colors text-sm font-bold uppercase tracking-widest">Eventos</Link>
          <Link to="/gallery" className="text-slate-400 hover:text-rumbero-red transition-colors text-sm font-bold uppercase tracking-widest">Galería</Link>
          <Link to="/contact" className="text-slate-400 hover:text-rumbero-red transition-colors text-sm font-bold uppercase tracking-widest">Contacto</Link>
        </div>
        {/* CTA Button */}
        <Link to="/contact" className="hidden lg:inline-block bg-rumbero-red hover:bg-red-700 text-white px-8 py-3 rounded font-black text-sm uppercase tracking-tighter transition-all hover:scale-105 active:scale-95">
          Únete al Equipo
        </Link>
      </div>
    </nav>
  );
}

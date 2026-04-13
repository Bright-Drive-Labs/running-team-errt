import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/about', label: 'Nosotros' },
    { to: '/training', label: 'Entrenos' },
    { to: '/portal', label: 'Portal' },
    { to: '/events', label: 'Eventos' },
    { to: '/gallery', label: 'Galería' },
    { to: '/contact', label: 'Contacto' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-deep-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
          <img
            src="/logo.png"
            alt="Logo Escuadrón Rumbero"
            className="h-16 w-auto object-contain hover:scale-105 transition-transform"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-slate-400 hover:text-racing-red transition-colors text-sm font-bold uppercase tracking-widest"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA Button */}
        <Link
          to="/contact"
          className="hidden lg:inline-block bg-racing-red hover:bg-red-700 text-white px-8 py-3 rounded font-black text-sm uppercase tracking-tighter transition-all hover:scale-105 active:scale-95"
        >
          Únete al Equipo
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Abrir menú"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden bg-rumbero-black border-t border-white/10 px-6 py-8 flex flex-col gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className="text-slate-300 hover:text-rumbero-red transition-colors text-lg font-black uppercase tracking-widest border-b border-white/5 pb-4"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/contact"
            onClick={closeMenu}
            className="mt-4 w-full bg-rumbero-red hover:bg-red-700 text-white px-8 py-4 rounded font-black text-sm uppercase tracking-widest transition-all text-center"
          >
            Únete al Equipo
          </Link>
        </div>
      )}
    </nav>
  );
}

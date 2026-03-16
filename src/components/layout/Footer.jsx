import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-rumbero-black text-slate-100 py-24 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16 mb-20">
          {/* Massive Typography Section */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <h2 className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tighter mb-4 italic text-transparent bg-clip-text" style={{ WebkitTextStroke: '1px rgba(255, 255, 255, 0.3)' }}>
                LENTO Y<br />CONTENTO
              </h2>
              <p className="text-slate-500 max-w-sm mt-6 font-medium">
                Únete a la mejor comunidad de corredores. Más que un equipo, somos una familia impulsada por la pasión y la alegría pura.
              </p>
            </div>
            <div className="mt-12 flex items-center gap-6">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-rumbero-red hover:border-rumbero-red transition-all group">
                <Instagram className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
              <a href="https://wa.me/57000000" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-rumbero-red hover:border-rumbero-red transition-all group">
                <MessageCircle className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
              <a href="mailto:contact@escuadronrumbero.com" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-rumbero-red hover:border-rumbero-red transition-all group">
                <Mail className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
            </div>
          </div>
          {/* Links Columns */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-8">Comunidad</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-slate-500 hover:text-rumbero-red transition-colors font-medium">Historia</Link></li>
              <li><Link to="/training" className="text-slate-500 hover:text-rumbero-red transition-colors font-medium">Entrenamientos</Link></li>
              <li><Link to="/events" className="text-slate-500 hover:text-rumbero-red transition-colors font-medium">Eventos</Link></li>
              <li><Link to="/gallery" className="text-slate-500 hover:text-rumbero-red transition-colors font-medium">Galería Visual</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-8">Comunidad</h4>
            <ul className="space-y-4">
              <li><Link to="#" className="text-slate-500 hover:text-rumbero-red transition-colors font-medium">Merch Store</Link></li>
              <li><Link to="#" className="text-slate-500 hover:text-rumbero-red transition-colors font-medium">Seguridad</Link></li>
              <li><Link to="#" className="text-slate-500 hover:text-rumbero-red transition-colors font-medium">Patrocinadores</Link></li>
            </ul>
          </div>
          {/* Contact Details */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-8">Contacto</h4>
            <p className="text-rumbero-red font-bold text-sm mb-4">contacto@escuadronrumbero.com</p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Sede Central<br />
              Pista Atlética<br />
              Bogotá, Colombia
            </p>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-xs font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} ESCUADRÓN RUMBERO. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex items-center gap-8">
            <Link to="#" className="text-slate-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Privacy Policy</Link>
            <Link to="#" className="text-slate-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

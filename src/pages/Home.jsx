import { Link } from "react-router-dom";
import { Users, Calendar, Flag } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-rumbero-black overflow-hidden">
          {/* Fondo para el Hero con tamaño congelado (bg-auto) */}
          <div className="absolute inset-0 bg-[url('/165441_2.jpg')] bg-auto bg-center bg-no-repeat opacity-80"></div>
          
          {/* Degradado negro inferior súper suave para no tapar a las personas sentadas */}
          <div className="absolute inset-0 bg-gradient-to-t from-rumbero-black/30 via-transparent to-transparent z-10"></div>
          
          {/* Decoración dinámica roja */}
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-rumbero-red/20 rounded-full blur-3xl animate-pulse z-10"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-rumbero-red/20 rounded-full blur-3xl z-10"></div>
        </div>
        {/* Hero Content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-block bg-rumbero-red text-white px-4 py-1 mb-6 font-black uppercase text-xs tracking-[0.3em] italic">
            Desde 2022
          </div>
          <h1 className="text-white text-4xl sm:text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase mb-6 italic">
            Más que <br /> <span className="text-rumbero-red">un equipo</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Únete a la comunidad de corredores más vibrante. Pasión, disciplina y kilómetros de alegría pura. Nuestra filosofía: Lento y contento!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="w-full sm:w-auto bg-rumbero-red text-white px-12 py-5 rounded font-black uppercase tracking-widest text-base hover:bg-red-700 hover:scale-105 transition-all shadow-xl">
              Únete Hoy
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-rumbero-black py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-rumbero-red font-black uppercase tracking-[0.2em] mb-4">Nuestra Filosofía</h2>
              <h3 className="text-white text-5xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-tight italic">
                Lento y Contento
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-10">
                "Creemos que correr es para todos. No se trata solo de cronómetros o medallas, sino de construir constancia, disfrutar el viaje y crecer como equipo. Bajo nuestra filosofía 'Lento y Contento', priorizamos trotes suaves que fortalecen tu base, evitan lesiones y te permiten disfrutar el camino por años. Aquí celebramos cada kilómetro y cada ritmo, porque lo importante no es quién llega primero, sino que nunca dejamos de recorrer la ruta."
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a0a0a] p-6 rounded-lg border border-white/5 group hover:border-rumbero-red transition-all">
                  <Calendar className="text-rumbero-red w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-white font-bold text-xl mb-2">Entrenamiento</h4>
                  <p className="text-slate-400 text-sm">Planes que se adaptan a tu vida, priorizando la prevención y mejora continua.</p>
                </div>
                <div className="bg-[#1a0a0a] p-6 rounded-lg border border-white/5 group hover:border-rumbero-red transition-all">
                  <Users className="text-rumbero-red w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-white font-bold text-xl mb-2">Comunidad</h4>
                  <p className="text-slate-400 text-sm">Un grupo diverso donde el aliento de un compañero vale más que un trofeo personal.</p>
                </div>
              </div>
            </div>
            
            {/* Team photo */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-rumbero-red/20 rounded-xl blur-2xl group-hover:bg-rumbero-red/40 transition-all duration-500"></div>
              <div className="relative rounded-xl w-full h-[500px] border border-white/10 overflow-hidden shadow-2xl">
                <img 
                  src="/171125.jpg" 
                  alt="Escuadrón Rumbero Running Team" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Quick CTA banner */}
      <section className="bg-rumbero-red py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="text-white text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-center md:text-left">
            ¿Listo para dominar <br className="hidden md:block"/> la próxima carrera?
          </h2>
          <Link to="/contact" className="bg-rumbero-black text-white px-12 py-6 rounded font-black uppercase tracking-[0.2em] text-lg hover:scale-105 transition-transform shadow-xl">
            Empieza Ahora
          </Link>
        </div>
      </section>
    </div>
  );
}

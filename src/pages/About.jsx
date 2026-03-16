import { Quote, Target, Heart, Award } from "lucide-react";

export default function About() {
  return (
    <div className="bg-rumbero-white min-h-screen">
      {/* Header section */}
      <section className="bg-rumbero-black text-white py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="w-full md:w-1/2">
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic mb-6">
              Nuestra <span className="text-rumbero-red">Historia</span>
            </h1>
            <p className="text-slate-400 text-xl md:text-2xl leading-relaxed">
              Nacidos en 2022 de la pasión por devorar kilómetros y el deseo de crear una comunidad donde todos encajan. En el Escuadrón Rumbero, no importa si corres a 4:00 o a 7:30 el km, lo que importa es el movimiento.
            </p>
          </div>
          
          {/* Image Content */}
          <div className="w-full md:w-1/2 relative group">
            {/* Glow decoration */}
            <div className="absolute inset-0 bg-rumbero-red blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full scale-75"></div>
            
            {/* Image frame */}
            <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl transform md:rotate-2 group-hover:rotate-0 transition-all duration-500 bg-rumbero-black z-10">
              <img 
                src="/165441_2.jpg" 
                alt="Escuadrón Rumbero" 
                className="w-full h-auto object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-rumbero-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Coach Quote Section */}
      <section className="py-24 px-6 bg-rumbero-red relative">
        <div className="max-w-4xl mx-auto text-center">
          <Quote className="w-16 h-16 mx-auto text-white/30 mb-8" />
          <h2 className="text-3xl md:text-5xl text-white font-black uppercase tracking-tighter italic leading-snug mb-8">
            "El dolor es temporal, pero la satisfacción de cruzar la meta con tu equipo es para toda la vida."
          </h2>
          <p className="text-white font-bold uppercase tracking-widest">— Coach Principal M.A.</p>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center group">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-rumbero-red transition-colors">
              <Target className="w-8 h-8 text-rumbero-black group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-rumbero-black">Disciplina</h3>
            <p className="text-slate-600 leading-relaxed">La constancia vence al talento cuando el talento no se esfuerza. Entrenamos con un propósito claro y un plan estructurado.</p>
          </div>
          <div className="text-center group">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-rumbero-red transition-colors">
              <Heart className="w-8 h-8 text-rumbero-black group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-rumbero-black">Cultura Lenta</h3>
            <p className="text-slate-600 leading-relaxed">"Lento y Contento". Honrar el proceso, evitar lesiones y disfrutar del entorno. Correr es un privilegio que celebramos a cada paso.</p>
          </div>
          <div className="text-center group">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-rumbero-red transition-colors">
              <Award className="w-8 h-8 text-rumbero-black group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-rumbero-black">Trabajo en Equipo</h3>
            <p className="text-slate-600 leading-relaxed">El running puede ser individual, pero nosotros lo hacemos un deporte de equipo. Festejamos tus 5K igual que un maratón completo.</p>
          </div>
        </div>
      </section>

      {/* Simple Image Grid Placeholder */}
      <section className="pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-64 bg-slate-200 rounded-lg shadow-inner flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest italic text-xs">Pista</div>
          <div className="h-64 bg-slate-300 rounded-lg shadow-inner flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest italic text-xs">Montaña</div>
          <div className="h-64 bg-slate-200 rounded-lg shadow-inner flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest italic text-xs">Asfalto</div>
          <div className="h-64 bg-slate-300 rounded-lg shadow-inner flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest italic text-xs">Celebración</div>
        </div>
      </section>
    </div>
  );
}

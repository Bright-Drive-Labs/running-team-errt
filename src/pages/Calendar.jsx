import { Link } from "react-router-dom";
import { Dumbbell, Zap, Mountain, Activity, MapPin } from "lucide-react";

export default function Training() {
  return (
    <div className="bg-rumbero-white min-h-screen">
      {/* Header section */}
      <section className="bg-rumbero-black text-white py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
          <div className="w-full md:w-1/2">
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-black uppercase tracking-tighter italic mb-6">
              Filosofía de <br/><span className="text-rumbero-red">Entrenamiento</span>
            </h1>
            <p className="text-slate-400 text-xl leading-relaxed">
              Descubre cómo estructuramos nuestras semanas. Nuestra metodología integral combina la resistencia en asfalto, la velocidad en pista y la fuerza en el gimnasio para construir corredores implacables.
            </p>
          </div>
          <div className="w-full md:w-1/2 relative group">
             <div className="absolute inset-0 bg-rumbero-red blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full scale-75"></div>
             <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl transform md:-rotate-2 group-hover:rotate-0 transition-all duration-500 bg-rumbero-black z-10">
               <div className="h-80 bg-[url('/174261.JPG')] bg-cover bg-center">
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Philosophy Details */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        {/* Strength Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-4xl text-rumbero-black font-black uppercase tracking-tighter italic mb-6">¿Por qué el <span className="text-rumbero-red">Fortalecimiento?</span></h2>
            <p className="text-slate-600 leading-relaxed text-lg mb-6">
              Correr no se trata solo de mover las piernas rápido. Un core de acero y músculos estabilizadores preparados son el secreto para correr más lejos y libre de lesiones. Por eso, integramos planes de acondicionamiento muscular en la semana.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-center">
                <Dumbbell className="text-rumbero-red w-6 h-6 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Prevención activa de lesiones en articulaciones.</span>
              </li>
              <li className="flex gap-4 items-center">
                <Zap className="text-rumbero-red w-6 h-6 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Mayor potencia, técnica y explosividad en cada zancada.</span>
              </li>
            </ul>
             <p className="mt-8 text-sm font-bold uppercase tracking-widest text-rumbero-red">Lunes, Martes y Jueves: Funcional</p>
          </div>
          <div className="bg-slate-100 p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center h-full">
            <Dumbbell className="w-20 h-20 text-slate-300 mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-widest text-rumbero-black mb-2">Fuerza Base</h3>
            <p className="text-slate-500 font-medium">Ejercicios de peso corporal y gimnasio</p>
          </div>
        </div>

        {/* Speed & Tempo Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center flex-col-reverse md:flex-row-reverse mb-24">
          <div className="order-1 md:order-2">
            <h2 className="text-4xl text-rumbero-black font-black uppercase tracking-tighter italic mb-6">Velocidad y <span className="text-rumbero-red">Resistencia</span></h2>
            <p className="text-slate-600 leading-relaxed text-lg mb-6">
              La resistencia aeróbica y anaeróbica se trabajan de formas distintas. Mantenemos el ritmo con intervalos, series de velocidad y trotes de recuperación ("Lento y Contento") que fortalecen el corazón y la respiración de todos nuestros atletas.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-center">
                <Activity className="text-rumbero-red w-6 h-6 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Eleva tu umbral anaeróbico y mejora tu oxigenación.</span>
              </li>
              <li className="flex gap-4 items-center">
                <MapPin className="text-rumbero-red w-6 h-6 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Entrenamientos en pista atlética y paseos urbanos.</span>
              </li>
            </ul>
            <p className="mt-8 text-sm font-bold uppercase tracking-widest text-rumbero-red">Martes, Miércoles y Viernes: Trote/Pista</p>
          </div>
          <div className="bg-slate-100 p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center order-2 md:order-1 h-full">
            <Activity className="w-20 h-20 text-slate-300 mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-widest text-rumbero-black mb-2">Ritmo en Pista</h3>
            <p className="text-slate-500 font-medium">Series, Tempo y Trote Suave</p>
          </div>
        </div>

        {/* Long Runs Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl text-rumbero-black font-black uppercase tracking-tighter italic mb-6">Los Domingos de <span className="text-rumbero-red">Fondo Largo</span></h2>
            <p className="text-slate-600 leading-relaxed text-lg mb-6">
              Es el día donde todo el equipo se une verdaderamente. Los domingos realizamos nuestros infaltables "Long Runs" (fondos largos), donde visitamos distintas localidades y recorremos largas distancias a nuestro propio ritmo.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-center">
                <Mountain className="text-rumbero-red w-6 h-6 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Rutas dinámicas (Montaña, El Tigre, Paseo de la Virgen).</span>
              </li>
              <li className="flex gap-4 items-center">
                <MapPin className="text-rumbero-red w-6 h-6 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Convivencia en equipo post-rutina para celebrar los kilómetros.</span>
              </li>
            </ul>
          </div>
          <div className="bg-rumbero-black p-12 rounded-2xl border border-rumbero-red/20 text-center shadow-2xl shadow-rumbero-red/10 group hover:-translate-y-2 transition-transform">
            <Mountain className="w-20 h-20 text-rumbero-red mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Fondo Dominical</h3>
            <p className="text-slate-400 font-medium text-sm mb-8">Todos los domingos</p>
            <Link to="/contact" className="bg-rumbero-red text-white px-6 py-4 rounded text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors w-full inline-block">
              ¿Quieres venir este Domingo?
            </Link>
          </div>
        </div>
      </section>

      {/* Call to action VIP Future (Teaser) */}
      <section className="bg-rumbero-white py-16 px-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto bg-rumbero-red/5 p-10 rounded-2xl border-2 border-dashed border-rumbero-red/30 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-rumbero-black mb-4 italic">Portal de Atletas <span className="text-rumbero-red">(Muy Pronto)</span></h2>
           <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
             Próximamente los miembros oficiales del Escuadrón Rumbero podrán iniciar sesión aquí para recibir sus planes diarios en calendario y enviarlos automáticamente a sus dispositivos Garmin / Strava.
           </p>
           <button disabled className="bg-slate-300 text-slate-500 px-10 py-4 rounded font-bold uppercase tracking-widest text-sm cursor-not-allowed opacity-70">
             Iniciar Sesión (VIP)
           </button>
        </div>
      </section>

    </div>
  );
}

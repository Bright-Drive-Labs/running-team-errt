import React, { useState } from "react";
import { Quote, Target, Heart, Award, ChevronLeft, ChevronRight } from "lucide-react";

export default function About() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const carouselImages = [
    { src: '/174409.JPG', label: 'Pista' },
    { src: '/174404.JPG', label: 'Carrera' },
    { src: '/174359.JPG', label: 'Asfalto' },
    { src: '/174363.JPG', label: 'Celebración', rotate: true },
    { src: '/174260.JPG', label: 'Historia' },
    { src: '/174261.JPG', label: 'Entrenamientos' },
    { src: '/174355.jpg', label: 'Equipo' },
    { src: '/174424.JPG', label: 'Fuerza' },
    { src: '/171125.jpg', label: 'Velocidad' }
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const getRelativePosition = (index) => {
    let diff = index - currentIndex;
    const length = carouselImages.length;
    if (diff > Math.floor(length / 2)) diff -= length;
    if (diff < -Math.floor(length / 2)) diff += length;
    return diff;
  };

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
              "Nacimos en 2022 como un grupo de amigos decididos a transformar el running de una actividad solitaria en un estilo de vida compartido. Hoy, el Escuadrón Rumbero es una familia en movimiento donde lo que importa no es el cronómetro, sino el propósito de avanzar juntos y sin presiones. No importa si corres a 4:00 o a 7:30 el kilómetro, aquí celebramos la constancia de quienes disfrutan cada tramo de la ruta y mantenemos el compromiso innegociable de nunca dejar de moverse."
            </p>
          </div>
          
          {/* Image Content */}
          <div className="w-full md:w-1/2 relative group">
            {/* Glow decoration */}
            <div className="absolute inset-0 bg-rumbero-red blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full scale-75"></div>
            
            {/* Image frame */}
            <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl transform md:rotate-2 group-hover:rotate-0 transition-all duration-500 bg-rumbero-black z-10">
              <img 
                src="/174260.JPG" 
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
            "Mi mayor orgullo es verte llegar a la meta sonriendo, agradeciendo a Dios por el camino recorrido y sabiendo que cada gota de sudor valió la pena."
          </h2>
          <p className="text-white font-bold uppercase tracking-widest">— Dany Perez, Coach Principal</p>
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

      {/* 3D Infinity Coverflow Carousel */}
      <section className="pb-32 px-6 max-w-[1400px] mx-auto overflow-hidden">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-rumbero-black">Momentos <span className="text-rumbero-red">Rumberos</span></h2>
          <div className="flex gap-4">
            <button onClick={handlePrev} className="w-12 h-12 bg-slate-200 hover:bg-rumbero-red hover:text-white rounded-full flex items-center justify-center transition-colors z-40">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleNext} className="w-12 h-12 bg-slate-200 hover:bg-rumbero-red hover:text-white rounded-full flex items-center justify-center transition-colors z-40">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        
        <div className="relative w-full h-[450px] md:h-[550px] lg:h-[650px] flex items-center justify-center bg-transparent mt-10">
          {carouselImages.map((img, index) => {
            const pos = getRelativePosition(index);
            
            // Default styling for items far away (invisible)
            let transformClasses = "scale-50 opacity-0 z-0 pointer-events-none";
            
            if (pos === 0) {
              // Center image
              transformClasses = "scale-100 opacity-100 z-30 translate-x-0 cursor-default shadow-2xl";
            } else if (pos === 1) {
              // Right image
              transformClasses = "scale-[0.80] opacity-60 z-20 translate-x-32 md:translate-x-[22rem] cursor-pointer shadow-xl hover:opacity-100";
            } else if (pos === -1) {
              // Left image
              transformClasses = "scale-[0.80] opacity-60 z-20 -translate-x-32 md:-translate-x-[22rem] cursor-pointer shadow-xl hover:opacity-100";
            } else if (pos === 2) {
              // Far right image
              transformClasses = "scale-[0.60] opacity-0 md:opacity-30 z-10 translate-x-64 md:translate-x-[36rem] pointer-events-none";
            } else if (pos === -2) {
              // Far left image
              transformClasses = "scale-[0.60] opacity-0 md:opacity-30 z-10 -translate-x-64 md:-translate-x-[36rem] pointer-events-none";
            }

            return (
              <div 
                key={index}
                onClick={() => { if (pos !== 0) setCurrentIndex(index); }}
                onMouseEnter={() => { if (Math.abs(pos) === 1) setCurrentIndex(index); }}
                className={`absolute w-72 md:w-[400px] lg:w-[500px] h-96 md:h-[550px] lg:h-[650px] rounded-2xl overflow-hidden transition-all duration-700 ease-out flex items-center justify-center group ${transformClasses}`}
              >
                {/* Blurry stretched background to fill empty space elegantly */}
                <div 
                  className={`absolute inset-0 bg-cover bg-center blur-2xl scale-150 opacity-40 transition-transform duration-1000 group-hover:scale-[1.6] ${img.rotate ? 'rotate-180' : ''}`}
                  style={{ backgroundImage: `url('${img.src}')` }}
                ></div>

                {/* Main uncropped image */}
                <div 
                  className={`absolute inset-0 bg-contain bg-no-repeat bg-center transition-transform duration-1000 group-hover:scale-105 ${img.rotate ? 'rotate-180' : ''}`}
                  style={{ backgroundImage: `url('${img.src}')` }}
                ></div>
                
                {/* Overlay that is darker when not focused, brighter when focused */}
                <div className={`absolute inset-0 transition-colors duration-700 mix-blend-multiply ${pos === 0 ? 'bg-transparent' : 'bg-black/60 group-hover:bg-red-900/40'}`}></div>
                
                <span className={`relative z-10 text-white font-black uppercase tracking-widest italic text-xl drop-shadow-xl transition-all duration-700 ${pos === 0 ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}`}>
                  {img.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

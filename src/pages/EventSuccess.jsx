import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function EventSuccess() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('/174355.jpg')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 md:p-14 text-center relative z-10 animate-[fade-in_0.5s_ease-out]">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-rumbero-black mb-4">
          ¡Cupo Confirmado!
        </h1>
        
        <div className="h-1 w-16 bg-rumbero-red mx-auto mb-6 rounded-full"></div>
        
        <p className="text-slate-600 font-medium mb-10 leading-relaxed">
          Tu correo electrónico ha sido verificado exitosamente y tu lugar en el <strong className="text-rumbero-black">Día Mundial del Corredor</strong> está oficialmente asegurado en nuestra base de datos.
        </p>
        
        <Link to="/events" className="inline-flex w-full justify-center items-center gap-3 bg-rumbero-black hover:bg-slate-800 text-white font-black uppercase tracking-widest py-4 px-8 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-xl transition-all hover:-translate-y-1">
          Volver a Eventos
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

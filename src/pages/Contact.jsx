import { MapPin, Mail, Phone, Instagram, Send } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-rumbero-white">
      <div className="grid lg:grid-cols-2 min-h-[90vh]">
        {/* Contact Info (Left) */}
        <div className="bg-rumbero-black text-white p-12 md:p-24 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rumbero-red/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-4">
              Ponte en <br /><span className="text-rumbero-red">Contacto</span>
            </h1>
            <p className="text-slate-400 mb-16 text-xl">¿Dudas sobre el entrenamiento? ¿Quieres unirte al equipo? Escríbenos y te responderemos al ritmo de sprint.</p>
            
            <div className="space-y-10">
              <div className="flex items-start gap-6 group cursor-pointer">
                <div className="bg-white/5 p-4 rounded-full group-hover:bg-rumbero-red transition-colors">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">WhatsApp Oficial</h3>
                  <p className="text-2xl font-bold">+57 000 000 0000</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group cursor-pointer">
                <div className="bg-white/5 p-4 rounded-full group-hover:bg-rumbero-red transition-colors">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Correo Electrónico</h3>
                  <p className="text-2xl font-bold">contacto@escuadronrumbero.com</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group cursor-pointer">
                <div className="bg-white/5 p-4 rounded-full group-hover:bg-rumbero-red transition-colors">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Instagram</h3>
                  <p className="text-2xl font-bold">@escuadron.rumbero</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (Right) */}
        <div className="bg-white p-12 md:p-24 flex flex-col justify-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-rumbero-black mb-8 border-l-4 border-rumbero-red pl-4">Envíanos un mensaje</h2>
          
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre Completo</label>
                <input type="text" className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Motivo</label>
                <select className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent">
                  <option>Quiero unirme al equipo</option>
                  <option>Duda sobre eventos</option>
                  <option>Propuesta de patrocinio</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Correo Electrónico</label>
              <input type="email" className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent" placeholder="tu@email.com" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Mensaje</label>
              <textarea rows="4" className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent resize-none" placeholder="Escribe aquí..."></textarea>
            </div>

            <button type="button" className="bg-rumbero-black text-white px-8 py-4 w-full md:w-auto font-black uppercase tracking-widest text-sm hover:bg-rumbero-red transition-colors flex justify-center items-center gap-2">
              Enviar Mensaje
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

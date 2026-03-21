import { useState } from "react";
import { MapPin, Mail, Phone, Instagram, Send, CheckCircle, Loader2 } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    reason: "Quiero unirme al equipo",
    email: "",
    message: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError("");
    
    try {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsSubmitted(true);
        setFormData({ name: "", reason: "Quiero unirme al equipo", email: "", message: "" });
        
        // Auto-esconder mensaje de éxito a los 5 segundos
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        setSubmitError(result.error || "Hubo un error del servidor al procesar el envío.");
      }
    } catch (err) {
      setSubmitError("Error de red. Verifica que el servidor Backend esté encendido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rumbero-white">
      <div className="grid lg:grid-cols-2 min-h-[90vh]">
        {/* Contact Info (Left) */}
        <div className="bg-rumbero-black text-white px-6 py-32 md:p-24 min-h-[85vh] lg:min-h-screen flex flex-col justify-center relative overflow-hidden">
          {/* Background Image requested by user */}
          <div className="absolute inset-0 bg-[url('/174424.JPG')] bg-cover bg-center opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-rumbero-black via-rumbero-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-rumbero-black via-transparent to-transparent md:hidden"></div>
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-rumbero-red/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0"></div>

          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-4 drop-shadow-md">
              Ponte en <br /><span className="text-rumbero-red">Contacto</span>
            </h1>
            <p className="text-slate-200 mb-16 text-xl drop-shadow-md font-medium">¿Dudas sobre el entrenamiento? ¿Quieres unirte al equipo? Escríbenos y te responderemos al ritmo de sprint.</p>
            
            <div className="space-y-10">
              <div className="flex items-start gap-6 group cursor-pointer" onClick={() => window.open('https://maps.app.goo.gl/ssiQ3pSff5FCLz5z8', '_blank')}>
                <div className="bg-white/10 p-4 rounded-full group-hover:bg-rumbero-red transition-all flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-300 uppercase tracking-widest text-xs font-bold mb-1">Punto de Encuentro</h3>
                  <a href="https://maps.app.goo.gl/ssiQ3pSff5FCLz5z8" target="_blank" rel="noreferrer" className="text-xl md:text-2xl font-bold hover:text-rumbero-red transition-colors underline decoration-white/30 underline-offset-4">
                    Paseo de la Virgen, El Tigre<br />Edo. Anzoátegui, Venezuela
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group cursor-pointer" onClick={() => window.open('https://wa.me/584147975648', '_blank')}>
                <div className="bg-white/10 p-4 rounded-full group-hover:bg-green-500 transition-all flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-300 uppercase tracking-widest text-xs font-bold mb-1">WhatsApp Oficial</h3>
                  <a href="https://wa.me/584147975648" target="_blank" rel="noreferrer" className="text-xl md:text-2xl font-bold hover:text-green-400 transition-colors">
                    +58 414 797 5648
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-6 group cursor-pointer" onClick={() => window.location.href='mailto:escuadronrumbero.running@gmail.com'}>
                <div className="bg-white/10 p-4 rounded-full group-hover:bg-rumbero-red transition-all backdrop-blur-sm shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-300 uppercase tracking-widest text-xs font-bold mb-1">Correo Electrónico</h3>
                  <p className="text-xl md:text-2xl font-bold hover:text-rumbero-red transition-colors">escuadronrumbero.running@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group cursor-pointer" onClick={() => window.open('https://instagram.com/escuadronrumbero.running', '_blank')}>
                <div className="bg-white/10 p-4 rounded-full group-hover:bg-[#E1306C] transition-all backdrop-blur-sm shadow-lg">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-300 uppercase tracking-widest text-xs font-bold mb-1">Instagram</h3>
                  <p className="text-xl md:text-2xl font-bold hover:text-[#E1306C] transition-colors">@escuadronrumbero.running</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (Right) */}
        <div className="bg-white p-12 md:p-24 flex flex-col justify-center">
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-rumbero-black mb-8 border-l-4 border-rumbero-red pl-4">Envíanos un mensaje</h2>
          
          {isSubmitted && (
             <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl mb-8 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
               <CheckCircle className="w-7 h-7 shrink-0 text-emerald-500 mt-1" />
               <div>
                 <p className="font-black text-lg uppercase tracking-wide">¡Mensaje Despachado!</p>
                 <p className="text-sm font-medium mt-1">Hemos recibido tu mensaje en nuestra bóveda corporativa. Un capitán del escuadrón lo estará revisando y te responderá al correo o WhatsApp provisto.</p>
               </div>
            </div>
          )}

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3">
              <span className="bg-white rounded-full p-1 text-red-500 shadow-sm block w-max">❌</span>
              {submitError}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre Completo *</label>
                <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Motivo de Contacto</label>
                <select name="reason" value={formData.reason} onChange={handleChange} className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent text-rumbero-black cursor-pointer">
                  <option value="Quiero unirme al equipo">Quiero unirme al Escuadrón</option>
                  <option value="Duda sobre eventos">Duda sobre Proximo Evento</option>
                  <option value="Propuesta de patrocinio">Propuesta Comercial o Patrocino</option>
                  <option value="Otro">Otro Asunto</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Correo Electrónico *</label>
              <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent" placeholder="tucorreo@email.com" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tu Mensaje *</label>
              <textarea required name="message" value={formData.message} onChange={handleChange} rows="4" className="w-full border-b-2 border-slate-200 py-3 focus:outline-none focus:border-rumbero-red transition-colors font-medium bg-transparent resize-none" placeholder="Escribe al detalle tu solicitud aquí..."></textarea>
            </div>

            <button disabled={isLoading || isSubmitted} type="submit" className="bg-rumbero-black text-white px-8 py-5 w-full md:w-auto font-black uppercase tracking-widest text-sm rounded-xl hover:bg-rumbero-red transition-colors flex justify-center items-center gap-2 shadow-lg disabled:opacity-50">
              {isLoading ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" /> ENVIANDO SEÑAL...
                 </>
              ) : isSubmitted ? (
                 <>
                   <CheckCircle className="w-5 h-5" /> ENVIADO
                 </>
              ) : (
                 <>
                   ENVIAR MENSAJE
                   <Send className="w-4 h-4 ml-2" />
                 </>
              )}
            </button>
            <p className="text-xs font-bold text-slate-400 mt-4 italic uppercase">Un capitán de nuestro escuadrón recibirá tu mensaje y de inmediato nos comunicaremos contigo.</p>
          </form>
        </div>
      </div>
    </div>
  );
}

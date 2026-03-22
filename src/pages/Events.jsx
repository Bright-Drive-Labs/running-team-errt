import { useState } from "react";
import API_BASE_URL from "../apiConfig";
import { CopyPlus, Calendar, MapPin, AlertCircle, ShieldAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function Events() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    distance: "5K",
    shirtSize: "M",
    emergencyFirstName: "",
    emergencyMiddleName: "",
    emergencyLastName: "",
    emergencyPhone: "",
    marketingOptIn: false
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsSubmitted(true);
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          phone: "",
          email: "",
          distance: "5K",
          shirtSize: "M",
          emergencyFirstName: "",
          emergencyMiddleName: "",
          emergencyLastName: "",
          emergencyPhone: "",
          marketingOptIn: false
        });
      } else {
        setSubmitError(result.error || "Hubo un error del servidor. Intenta de nuevo.");
      }
    } catch (err) {
      setSubmitError("Error de red. Verifica que el servidor Backend esté encendido.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-rumbero-white">
      {/* Header Héroe */}
      {/* Header Héroe Estilo Card (Restaurado a su gloria original) */}
      <div className="pt-8 md:pt-12 pb-6 px-6">
        <div className="relative max-w-7xl mx-auto bg-[#161616] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
          
          {/* Fondo de la imagen a la derecha */}
          <div className="absolute inset-0 md:left-1/3 z-0">
            <div 
              className="absolute inset-0 bg-cover bg-[center_20%] opacity-90"
              style={{ backgroundImage: "url('/174355.jpg')" }}
            ></div>
            {/* Gradiente majestuoso para fundir el negro con la foto */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#161616] via-[#161616]/80 to-transparent"></div>
            {/* Gradiente inferior para móviles */}
            <div className="absolute inset-0 bg-gradient-to-t md:hidden from-[#161616] via-transparent to-transparent"></div>
          </div>
          
          {/* Contenido a la izquierda */}
          <div className="relative z-10 p-10 md:p-14 lg:p-20 max-w-3xl w-full">
            <div className="inline-block bg-rumbero-red text-white font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Próximo Evento Oficial
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white mb-6 leading-[0.9] italic drop-shadow-md">
              Día Mundial <br/> del Corredor
            </h1>
            
            <p className="text-slate-300 text-base md:text-lg font-medium mb-10 max-w-xl leading-relaxed">
              Ven a celebrar con nosotros la fiesta más importante del running, el Día Mundial del Corredor. Son 5 kilómetros de pura pasión y locura rumbera. Un recorrido OPEN para todas las edades, diseñado para disfrutar y compartir. Contaremos con pacers, hidratación en ruta y un after-party espectacular.
            </p>
            
            <div className="flex flex-wrap gap-6 text-sm font-bold tracking-wider text-white">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rumbero-red shrink-0" />
                Miércoles 3 de Junio, 2026 - 5:00 PM
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rumbero-red shrink-0" />
                Calle 24 Sur cruce con 9na Carrera, El Tigre, Edo. Anzoátegui
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Formulario Principal (Centrado de lujo B2B) */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-rumbero-black mb-8 flex items-center gap-3 border-b-2 border-slate-100 pb-6">
              <CopyPlus className="text-rumbero-red" />
              Formulario de Inscripción Oficial
            </h2>
            
            {statusParam === 'ya_verificado' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl mb-8 flex items-start gap-4">
                 <AlertCircle className="w-7 h-7 shrink-0 text-emerald-500 mt-1" />
                 <div>
                   <p className="font-black text-lg uppercase tracking-wide">Ya estás verificado</p>
                   <p className="text-sm font-medium mt-1">Tu enlace de confirmación ya hizo su magia. Tu cupo está 100% asegurado en nuestra base de datos.</p>
                 </div>
              </div>
            )}
            
            {statusParam === 'error_token_invalido' && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl mb-8 flex items-start gap-4">
                 <AlertCircle className="w-7 h-7 shrink-0 text-red-500 mt-1" />
                 <div>
                   <p className="font-black text-lg uppercase tracking-wide">Enlace Expirado o Inválido</p>
                   <p className="text-sm font-medium mt-1">El código de confirmación no existe en la Base de Datos o ya prescribió.</p>
                 </div>
              </div>
            )}
            
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded mb-8 text-sm font-medium">
                {submitError}
              </div>
            )}
            
            {isSubmitted ? (
               <div className="bg-slate-50 border border-slate-200 text-rumbero-black p-10 md:p-16 rounded-3xl text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-rumbero-red"></div>
                 <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <span className="text-5xl">📧</span>
                 </div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-rumbero-black">¡Revisa tu Buzón de Correo!</h3>
                 <p className="font-medium text-slate-500 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                   Hemos guardado tus datos, pero para evitar robots, necesitamos que confirmes tu dirección email.
                 </p>
                 <div className="p-6 bg-white rounded-2xl shadow-sm text-sm text-center border border-slate-100 font-bold text-slate-600">
                    Acabamos de enviar un enlace mágico y seguro a tu bandeja de entrada. <br/><span className="text-rumbero-red">Por favor dale clic al botón rojo del correo para oficializar tu lugar.</span> (Busca en carpeta Spam)
                 </div>
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* SECCIÓN 1: IDENTIDAD DEL CORREDOR */}
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">1</span>
                    Identidad del Atleta
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Primer Nombre *</label>
                      <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red focus:border-rumbero-red outline-none transition-all placeholder:text-slate-300" placeholder="Ej. Daniel" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Segundo Nombre</label>
                      <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red focus:border-rumbero-red outline-none transition-all placeholder:text-slate-300" placeholder="Ej. Rafael" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Apellidos *</label>
                      <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red focus:border-rumbero-red outline-none transition-all placeholder:text-slate-300" placeholder="Ej. Pérez" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Teléfono Celular *</label>
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red outline-none focus:border-rumbero-red transition-all" placeholder="+1 234 567 8900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Correo Electrónico *</label>
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red outline-none focus:border-rumbero-red transition-all" placeholder="tucorreo@ejemplo.com" />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: DETALLES DE CARRERA */}
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">2</span>
                    Logística de Carrera
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Distancia Única</label>
                      <input type="text" readOnly value="5K (Recreativa OPEN)" className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 text-slate-500 font-bold outline-none cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Talla de Franela</label>
                      <select name="shirtSize" value={formData.shirtSize} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red outline-none focus:border-rumbero-red transition-all font-bold">
                        <option value="XS">Ex-Small (XS)</option>
                        <option value="S">Small (S)</option>
                        <option value="M">Medium (M)</option>
                        <option value="L">Large (L)</option>
                        <option value="XL">Ex-Large (XL)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3: CONTACTO DE EMERGENCIA MULTI-CAMPO */}
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-black uppercase tracking-widest text-rumbero-red mb-6 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6" />
                    Contacto de Emergencia
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">1er Nombre *</label>
                      <input type="text" name="emergencyFirstName" required value={formData.emergencyFirstName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red focus:border-rumbero-red outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">2do Nombre</label>
                      <input type="text" name="emergencyMiddleName" value={formData.emergencyMiddleName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red focus:border-rumbero-red outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Apellidos *</label>
                      <input type="text" name="emergencyLastName" required value={formData.emergencyLastName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red focus:border-rumbero-red outline-none transition-all placeholder:text-slate-300" />
                    </div>
                  </div>
                  
                  <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-slate-700">Teléfono de Emergencia *</label>
                      <input type="tel" name="emergencyPhone" required value={formData.emergencyPhone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-rumbero-red outline-none focus:border-rumbero-red transition-all" placeholder="Número ante emergencias" />
                  </div>
                </div>

                {/* CONSENTIMIENTOS */}
                <div className="pt-6 border-t border-slate-100">
                  <label className="flex items-start gap-4 p-6 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" name="marketingOptIn" checked={formData.marketingOptIn} onChange={handleChange} className="w-6 h-6 mt-1 text-rumbero-red bg-white border-slate-300 rounded focus:ring-rumbero-red" />
                    <div>
                      <span className="block font-bold text-rumbero-black mb-1">Consentimiento Comercial y de Publicidad</span>
                      <span className="text-sm text-slate-500 font-medium leading-relaxed block">
                        Deseo recibir correos con promociones de futuras carreras, invitaciones a entrenamientos especiales, y boletines mensuales del equipo Escuadrón Rumbero.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-center font-bold text-sm uppercase tracking-wide">
                    ⚠️ El proceso de inscripción ha finalizado exitosamente. ¡Nos vemos en la ruta!
                  </div>
                  <button type="button" disabled className="w-full bg-slate-400 text-white font-black uppercase tracking-[0.2em] py-5 rounded-xl cursor-not-allowed flex items-center justify-center gap-3">
                    INSCRIPCIONES CERRADAS
                  </button>
                  <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-6">Las inscripciones para este evento han llegado a su límite.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

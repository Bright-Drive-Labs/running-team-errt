import { useState, useEffect } from "react";
import { CopyPlus, Calendar, MapPin, Users } from "lucide-react";

export default function Events() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    distance: "5K",
    shirtSize: "M",
    emergencyContact: ""
  });
  
  const [registrations, setRegistrations] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Load from pseudo-database (localStorage)
    const stored = localStorage.getItem('errt_event_registrations');
    if (stored) {
      setRegistrations(JSON.parse(stored));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newReg = { ...formData, id: Date.now(), registeredAt: new Date().toISOString() };
    const updatedRegistrations = [...registrations, newReg];
    
    // Save to pseudo-database
    localStorage.setItem('errt_event_registrations', JSON.stringify(updatedRegistrations));
    setRegistrations(updatedRegistrations);
    
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        distance: "5K",
        shirtSize: "M",
        emergencyContact: ""
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Event Header Block */}
        <div className="bg-rumbero-black rounded-3xl overflow-hidden shadow-2xl mb-12 flex flex-col md:flex-row relative">
          <div className="md:w-1/2 p-12 lg:p-16 flex flex-col justify-center relative z-10">
            <span className="inline-block px-4 py-1 bg-rumbero-red text-white text-xs font-bold uppercase tracking-widest rounded-full w-max mb-6">Próximo Evento Oficial</span>
            <h1 className="text-5xl md:text-6xl text-white font-black uppercase tracking-tighter italic mb-4">
              Día Mundial <br />del Corredor
            </h1>
            <p className="text-slate-400 mb-8 max-w-md">
              Celebra con nosotros la fiesta más grande del running. Tendremos distancias para todos los niveles, pacers, hidratación y un after-party espectacular.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex items-center gap-3 text-white">
                <Calendar className="text-rumbero-red w-5 h-5" />
                <span className="font-bold text-sm">5 de Junio, 2026 - 6:00 AM</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <MapPin className="text-rumbero-red w-5 h-5" />
                <span className="font-bold text-sm">Parque Metropolitano</span>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 bg-slate-800 relative min-h-[300px]">
             {/* Fake image overlay */}
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
             <div className="absolute inset-0 bg-gradient-to-r from-rumbero-black to-transparent"></div>
          </div>
        </div>

        {/* Registration Layout */}
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-rumbero-black mb-8 flex items-center gap-3">
              <CopyPlus className="text-rumbero-red" />
              Formulario de Registro
            </h2>
            
            {isSubmitted ? (
               <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded-xl text-center">
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">¡Registro Exitoso!</h3>
                 <p className="font-medium">Te has inscrito correctamente en el evento. Guarda las fechas.</p>
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Nombre Completo</label>
                    <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rumbero-red/50 focus:border-rumbero-red transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Teléfono Celular</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rumbero-red/50 focus:border-rumbero-red transition-all font-medium" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Correo Electrónico</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rumbero-red/50 focus:border-rumbero-red transition-all font-medium" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Distancia</label>
                    <select required name="distance" value={formData.distance} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rumbero-red/50 focus:border-rumbero-red transition-all font-medium">
                      <option value="5K">5 Kilómetros (Recreativo)</option>
                      <option value="10K">10 Kilómetros (Competitivo)</option>
                      <option value="21K">21 Kilómetros (Media Maratón)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Talla de Camiseta (Shirt Size)</label>
                    <select required name="shirtSize" value={formData.shirtSize} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rumbero-red/50 focus:border-rumbero-red transition-all font-medium">
                      <option value="XS">Ex-Small (XS)</option>
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Ex-Large (XL)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Contacto de Emergencia (Nombre y Teléfono)</label>
                  <input required type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rumbero-red/50 focus:border-rumbero-red transition-all font-medium" placeholder="P.ej: María Gomez - 555-0101" />
                </div>

                <button type="submit" className="w-full bg-rumbero-red hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-4 rounded-lg shadow-[0_10px_20px_rgba(230,25,43,0.3)] hover:shadow-[0_10px_20px_rgba(230,25,43,0.5)] transition-all">
                  Confirmar Inscripción
                </button>
              </form>
            )}
          </div>

          {/* Data display (Pseudo Database view) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200 h-full">
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 mb-6">
                 <h3 className="text-xl font-black uppercase tracking-tight text-rumbero-black flex items-center gap-2">
                   <Users className="w-5 h-5" /> 
                   Roster de Inscritos
                 </h3>
                 <span className="bg-slate-300 text-slate-700 font-bold px-3 py-1 rounded-full text-xs">
                   {registrations.length} Total
                 </span>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {registrations.length === 0 ? (
                  <p className="text-slate-500 text-center font-medium italic mt-10">Aún no hay inscritos. ¡Sé el primero!</p>
                ) : (
                  registrations.map(reg => (
                    <div key={reg.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-rumbero-black truncate max-w-[150px]">{reg.fullName}</p>
                        <p className="text-xs text-slate-500">Talla: <span className="font-bold">{reg.shirtSize}</span></p>
                      </div>
                      <div className="bg-rumbero-red text-white font-black text-sm px-3 py-1 rounded">
                        {reg.distance}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

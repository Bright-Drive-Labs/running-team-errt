import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

export default function Calendar() {
  const schedule = [
    { day: "Lunes", type: "Fuerza y Acondicionamiento", time: "6:00 AM", location: "Gimnasio Base" },
    { day: "Martes", type: "Intervalos de Velocidad (Pista)", time: "6:30 AM", location: "Pista Atlética" },
    { day: "Miércoles", type: "Trote Suave / Recuperación", time: "6:00 AM", location: "Parque Central" },
    { day: "Jueves", type: "Fuerza y Movilidad", time: "6:00 AM", location: "Gimnasio Base" },
    { day: "Viernes", type: "Trabajo de Calidad (Tempo)", time: "6:30 AM", location: "Ciclovía Norte" },
    { day: "Sábado", type: "Descanso Activo", time: "-", location: "-" },
    { day: "Domingo", type: "Fondo Largo (Long Run)", time: "5:30 AM", location: "Montaña / Ruta Externa" },
  ];

  return (
    <div className="min-h-screen bg-rumbero-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl text-rumbero-black font-black uppercase tracking-tighter italic mb-4">
            Calendario de <span className="text-rumbero-red">Entrenamiento</span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            La constancia es la llave del éxito. Revisa nuestro cronograma semanal y prepárate para darlo todo en cada sesión.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {schedule.map((session, index) => (
            <div key={index} className={`p-8 rounded-xl border-2 transition-transform hover:-translate-y-2 ${session.day === 'Domingo' ? 'bg-rumbero-black text-white border-rumbero-black shadow-2xl shadow-rumbero-red/20' : 'bg-white text-rumbero-black border-slate-100 shadow-xl shadow-slate-200/50 hover:border-rumbero-red/30'}`}>
              <h3 className={`text-2xl font-black uppercase tracking-widest mb-6 ${session.day === 'Domingo' ? 'text-rumbero-red' : 'text-rumbero-black'}`}>
                {session.day}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className={`w-5 h-5 shrink-0 ${session.day === 'Domingo' ? 'text-slate-400' : 'text-rumbero-red'}`} />
                  <div>
                    <p className="font-bold text-sm leading-tight">{session.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 shrink-0 ${session.day === 'Domingo' ? 'text-slate-400' : 'text-slate-400'}`} />
                  <p className={`text-sm ${session.day === 'Domingo' ? 'text-slate-300' : 'text-slate-600'}`}>{session.time}</p>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 shrink-0 ${session.day === 'Domingo' ? 'text-slate-400' : 'text-slate-400'}`} />
                  <p className={`text-sm ${session.day === 'Domingo' ? 'text-slate-300' : 'text-slate-600'}`}>{session.location}</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="p-8 rounded-xl border-2 border-dashed border-rumbero-red/50 bg-rumbero-red/5 flex flex-col justify-center items-center text-center">
            <h3 className="text-xl font-black uppercase tracking-widest mb-4 text-rumbero-red">¿Primer día?</h3>
            <p className="text-sm text-slate-700 mb-6 font-medium">Llega 15 minutos antes para presentarte al coach y calentar con el equipo.</p>
            <button className="bg-rumbero-black text-white px-6 py-3 rounded text-sm font-bold uppercase tracking-widest hover:bg-rumbero-red transition-colors w-full">
              Escríbenos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

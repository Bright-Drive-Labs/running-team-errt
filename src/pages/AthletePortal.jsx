import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Calendar, MessageSquare, Zap, CheckCircle, XCircle, Loader2, Users, LayoutDashboard, ChevronRight } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API_BASE = "http://localhost:3000/api";

export default function AthletePortal() {
  const [user, setUser] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [allAthletes, setAllAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('athlete');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAthleteProfile(session.user.email);
      } else {
        setAthlete(null);
        setLoading(false);
      }
    });

    // Verificación inicial de sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAthleteProfile(session.user.email);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAthleteProfile = async (email) => {
    try {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('email', email)
        .single();

      if (data) {
        setAthlete(data);
        fetchAthleteData(data.id);
        if (data.is_coach) fetchCoachData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching profile", err);
      setLoading(false);
    }
  };

  const fetchAthleteData = async (athleteId) => {
    try {
      const { data } = await supabase
        .from('workout_assignments')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('status', 'PENDING')
        .order('target_date', { ascending: true });
      
      if (data) setPendingWorkouts(data);
    } catch (err) {
      console.error("Error fetching workouts", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachData = async () => {
    try {
      const { data } = await supabase
        .from('athletes')
        .select('*')
        .order('name');
      if (data) setAllAthletes(data);
    } catch (err) {
      console.error("Error fetching all athletes", err);
    }
  };

  const updateAthleteGroup = async (athleteId, newGroup) => {
    try {
      const { error } = await supabase
        .from('athletes')
        .update({ group_tag: newGroup })
        .eq('id', athleteId);
      
      if (!error) {
        setAllAthletes(prev => prev.map(a => a.id === athleteId ? { ...a, group_tag: newGroup } : a));
        if (athlete.id === athleteId) setAthlete({ ...athlete, group_tag: newGroup });
      } else {
        alert("Error al actualizar grupo");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/portal' }
    });
    if (error) alert("Error con Google Auth: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAthlete(null);
    setUser(null);
    setPendingWorkouts([]);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-racing-red" />
    </div>
  );

  if (!athlete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card p-12 max-w-md w-full text-center border-t-4 border-racing-red"
        >
          <Activity className="w-20 h-20 text-racing-red mx-auto mb-8" />
          <h1 className="lexend-title text-4xl mb-3 tracking-tighter uppercase">Portal del Atleta</h1>
          <p className="text-foreground/50 mb-10 font-inter text-sm px-4">Entra para gestionar tus entrenamientos de <strong>Bright Drive Agent</strong>.</p>
          
          <button 
            onClick={handleGoogleLogin} 
            className="flex items-center justify-center gap-4 w-full bg-white text-black py-5 rounded-md font-bold hover:bg-racing-red hover:text-white transition-all font-inter mb-8 shadow-2xl shadow-white/5"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 shadow-sm" alt="Google" />
            INICIAR SESIÓN CON GOOGLE
          </button>
          
          <div className="flex items-center justify-center gap-4 opacity-20">
            <div className="h-px w-8 bg-white" />
            <p className="text-[10px] uppercase font-black tracking-[0.3em]">SECURE ACCESS</p>
            <div className="h-px w-8 bg-white" />
          </div>
        </motion.div>
        
        <footer className="mt-12 text-center opacity-10 text-[9px] font-bold uppercase tracking-[0.8em]">
          Designed by Bright Drive Solutions
        </footer>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-racing-red font-black text-xs tracking-[0.4em] uppercase mb-4">Centro de Rendimiento</p>
          <h1 className="lexend-title text-5xl md:text-7xl lg:text-8xl uppercase font-black leading-[0.85] tracking-tighter">
            HOLA,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20">{athlete.name.split(' ')[0]}</span>
          </h1>
        </motion.div>

        <div className="flex flex-col items-end gap-6 pb-2">
            <button 
              onClick={handleLogout} 
              className="text-[10px] text-white/30 hover:text-white transition-colors uppercase font-black tracking-[0.3em] flex items-center gap-2 group mb-2"
            >
              Cerrar Sesión <XCircle className="w-3 h-3 group-hover:text-racing-red transition-colors" />
            </button>
            
            {athlete.is_coach && (
              <div className="bg-white/5 p-1 rounded-sm flex gap-1 border border-white/5 shadow-inner mb-2">
                <button onClick={() => setActiveTab('athlete')} className={`px-6 py-2 rounded-sm text-[10px] font-black tracking-widest transition-all ${activeTab === 'athlete' ? 'bg-racing-red text-white shadow-lg' : 'text-white/20 hover:text-white/50'}`}>ATLETA</button>
                <button onClick={() => setActiveTab('coach')} className={`px-6 py-2 rounded-sm text-[10px] font-black tracking-widest transition-all ${activeTab === 'coach' ? 'bg-racing-red text-white shadow-lg' : 'text-white/20 hover:text-white/50'}`}>COACH</button>
              </div>
            )}
        </div>
      </header>

      {/* DASHBOARD BAR - Biometría & Récords */}
      {activeTab === 'athlete' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/5 border border-white/10 mb-12 rounded-sm overflow-hidden"
        >
          <div className="bg-black/40 p-6">
            <p className="text-white/20 text-[9px] uppercase font-black mb-1">Edad</p>
            <p className="lexend-title text-xl">47 <span className="text-[10px] text-white/30 italic">y/o</span></p>
          </div>
          <div className="bg-black/40 p-6">
            <p className="text-white/20 text-[9px] uppercase font-black mb-1">Peso</p>
            <p className="lexend-title text-xl">{athlete.weight || "119.6"} <span className="text-xs text-white/30 italic">kg</span></p>
          </div>
          <div className="bg-black/40 p-6 border-r border-white/5">
            <p className="text-white/20 text-[9px] uppercase font-black mb-1">Altura</p>
            <p className="lexend-title text-xl">{athlete.height || "173"} <span className="text-xs text-white/30 italic">cm</span></p>
          </div>
          <div className="bg-black/40 p-6 flex flex-col justify-center">
            <p className="text-white/20 text-[9px] uppercase font-black mb-1">FC Reposo/Máx</p>
            <p className="lexend-title text-xl text-white">
               <span className="text-green-500">{athlete.resting_hr || "50"}</span>
               <span className="text-white/20 mx-2">/</span>
               <span className="text-racing-red">{athlete.max_hr || "182"}</span>
            </p>
          </div>
          <div className="bg-racing-red/10 p-6 lg:col-span-2 flex items-center justify-between border-l border-racing-red/30">
             <div>
                <p className="text-racing-red font-black text-[9px] uppercase mb-1 tracking-widest">Personal Best 5K</p>
                <p className="lexend-title text-3xl italic tracking-tighter decoration-racing-red underline underline-offset-4">{athlete.pb_5k || "24:50"}</p>
             </div>
             <div className="text-right">
                <p className="text-white/20 text-[9px] uppercase font-black mb-1">Escuadrón</p>
                <p className="font-black text-racing-red uppercase italic tracking-tighter">{athlete.group_tag}</p>
             </div>
          </div>
        </motion.div>
      )}

      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'athlete' ? (
            <motion.div 
              key="athlete-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* Main Column: Workouts */}
              <div className="lg:col-span-8 space-y-10">
                {pendingWorkouts.length === 0 ? (
                  <div className="glass-card flex flex-col items-center justify-center text-center p-32 border-dashed border-white/5 border-2">
                    <CheckCircle className="w-20 h-20 text-green-500/20 mb-8" />
                    <h3 className="lexend-title text-3xl font-black opacity-30 uppercase tracking-tighter">Estado: Óptimo</h3>
                  </div>
                ) : (
                    pendingWorkouts.map((w, idx) => (
                    <motion.div 
                      key={w.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-card overflow-hidden border-l-8 border-racing-red p-10 hover:shadow-2xl hover:shadow-racing-red/10 transition-all duration-500 group"
                    >
                      <div className="flex justify-between items-start mb-8">
                         <div>
                           <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full bg-racing-red animate-ping" />
                             <span className="text-racing-red font-black text-[10px] tracking-[0.4em] uppercase">{w.workout_name.split(':')[0] || "PROYECTO"}</span>
                           </div>
                           <h2 className="lexend-title text-4xl lg:text-5xl font-black tracking-tighter uppercase group-hover:text-racing-red transition-colors duration-500">
                             {w.workout_name.includes(':') ? w.workout_name.split(':')[1] : w.workout_name}
                           </h2>
                           <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-3">
                             <Calendar className="w-3 h-3 text-racing-red" />
                             {new Date(w.target_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                           </p>
                         </div>
                      </div>
                      
                      <div className="monolith-code mb-10 text-white/60 p-6 bg-black/50 rounded border border-white/5 font-mono text-sm leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                        {w.markdown_payload.split('\\n').map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-6">
                        <button className="bg-white text-black hover:bg-racing-red hover:text-white flex-[2] py-6 font-black uppercase text-xs tracking-widest transition-all shadow-xl">
                          Sincronizar Garmin
                        </button>
                        <button className="bg-transparent border border-white/10 hover:border-white/40 flex-1 py-6 font-black uppercase text-[10px] tracking-widest transition-all text-white/40 hover:text-white">
                          Detalles
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              {/* Sidebar Column: Zones & Tip */}
              <aside className="lg:col-span-4 space-y-8">
                {/* Zonas de Poder (Garmin Style: Z5 to Z1) */}
                <div className="glass-card p-10 border-white/5">
                  <h4 className="text-racing-red font-black text-[10px] uppercase tracking-[0.4em] mb-8 font-inter">Zonas de Poder (min/km)</h4>
                  <div className="space-y-3">
                    {athlete.zone_paces ? Object.entries(athlete.zone_paces).reverse().map(([zone, pace]) => {
                      const zoneColors = {
                        "Z5": "text-racing-red bg-racing-red/10 border-racing-red/20 scale-105 shadow-lg",
                        "Z4": "text-orange-500 bg-orange-500/5 border-orange-500/10 opacity-90",
                        "Z3": "text-yellow-500 bg-yellow-500/5 border-yellow-500/10 opacity-80",
                        "Z2": "text-blue-400 bg-blue-400/5 border-blue-400/10 opacity-70",
                        "Z1": "text-green-500 bg-green-500/5 border-green-500/10 opacity-60"
                      };
                      return (
                        <div key={zone} className={`flex justify-between items-center p-4 rounded-sm border transition-all ${zoneColors[zone] || 'text-white/50 bg-white/5'}`}>
                          <span className="font-black text-xs uppercase italic">{zone}</span>
                          <span className="font-mono text-sm font-black tracking-widest uppercase">{pace}</span>
                        </div>
                      );
                    }) : (
                      <p className="text-xs text-white/20 uppercase font-bold italic">Configurando Zonas...</p>
                    )}
                  </div>
                </div>

                <div className="p-10 bg-black/40 border border-white/5 rounded-sm relative group overflow-hidden">
                  <Zap className="absolute top-0 right-0 p-4 w-12 h-12 text-racing-red opacity-10" />
                  <h3 className="lexend-title text-base font-black uppercase tracking-tight mb-4">Tip del Coach</h3>
                  <p className="text-sm text-white/50 leading-relaxed italic border-l-2 border-racing-red pl-4 py-2">
                    "Usa tu FC de reposo como sensor: si sube 5-10 pulsaciones sobre lo normal al despertar, considera un día de descanso extra."
                  </p>
                </div>
              </aside>
            </motion.div>
           ) : (
            /* COACH VIEW */
            <motion.div 
              key="coach-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="glass-card p-10 border-l-8 border-blue-500 hover:translate-y-[-4px] transition-transform duration-500">
                    <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.3em]">Total Atletas</p>
                    <p className="lexend-title text-7xl font-black mt-4">{allAthletes.length}</p>
                  </div>
                  <div className="glass-card p-10 border-l-8 border-racing-red hover:translate-y-[-4px] transition-transform duration-500">
                    <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.3em]">Sessions Today</p>
                    <p className="lexend-title text-7xl font-black mt-4">0</p>
                  </div>
                  <div className="glass-card p-10 border-l-8 border-green-500 hover:translate-y-[-4px] transition-transform duration-500">
                    <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.3em]">Completed</p>
                    <p className="lexend-title text-7xl font-black mt-4">0</p>
                  </div>
              </div>

              <div className="glass-card overflow-hidden shadow-2xl">
                 <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="lexend-title text-2xl font-black uppercase tracking-tighter">Escuadrón Registrado</h3>
                    <div className="flex gap-4">
                      <button className="text-[10px] font-black tracking-widest bg-white/5 hover:bg-white/10 px-6 py-3 rounded-sm transition-all border border-white/5">FILTRAR</button>
                      <button className="text-[10px] font-black tracking-widest bg-racing-red text-white px-6 py-3 rounded-sm transition-all shadow-lg shadow-racing-red/20">AÑADIR ATLETA</button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-white/5 text-[9px] uppercase font-black tracking-[0.4em] text-white/20">
                       <tr>
                         <th className="p-8">Nombre del Atleta</th>
                         <th className="p-8 text-center">Grupo / Escuadrón</th>
                         <th className="p-8">ID Intervals</th>
                         <th className="p-8">Última Actividad</th>
                         <th className="p-8 text-right">Acciones de Comando</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                       {allAthletes.map(a => (
                         <tr key={a.id} className="hover:bg-white/[0.04] transition-colors group">
                           <td className="p-8">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-black group-hover:bg-racing-red transition-colors">{a.name[0]}</div>
                               <span className="font-black text-lg uppercase tracking-tight">{a.name}</span>
                             </div>
                           </td>
                           <td className="p-8 text-center">
                             <select 
                               value={a.group_tag}
                               onChange={(e) => updateAthleteGroup(a.id, e.target.value)}
                               className="bg-racing-red/10 text-racing-red px-4 py-2 rounded-full font-black tracking-[0.2em] border border-racing-red/20 outline-none appearance-none cursor-pointer hover:bg-racing-red/20 transition-all text-[9px] uppercase text-center"
                             >
                               <option value="PRINCIPIANTE">PRINCIPIANTE</option>
                               <option value="INTERMEDIO">INTERMEDIO</option>
                               <option value="AVANZADO">AVANZADO</option>
                               <option value="ELITE">ELITE</option>
                             </select>
                           </td>
                           <td className="p-8 font-mono text-xs text-white/30 tracking-widest italic">{a.intervals_athlete_id}</td>
                           <td className="p-8 text-[10px] text-white/20 uppercase font-bold">Sin actividad hoy</td>
                           <td className="p-8 text-right">
                             <button className="text-[9px] font-black tracking-widest border border-white/10 px-5 py-3 rounded-sm hover:border-racing-red hover:text-racing-red transition-all flex items-center gap-2 ml-auto">
                               DETALLES <ChevronRight className="w-3 h-3" />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="mt-32 text-center opacity-10 text-[9px] font-bold uppercase tracking-[1em] pb-10">
        Designed by Bright Drive Solutions
      </footer>
    </div>
  );
}

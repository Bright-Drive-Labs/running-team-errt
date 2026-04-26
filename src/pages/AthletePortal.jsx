import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { calculatePaceZones } from '../lib/vdot-calculator';
import { Activity, Calendar, MessageSquare, Zap, CheckCircle, XCircle, Loader2, Users, LayoutDashboard, ChevronRight, Save, ShieldCheck, User, Gauge, Heart, AlertCircle, Trophy, Shirt, Phone, Crown, Lock } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const sanitizeAthleteData = (formData) => {
  const cleanData = { ...formData };
  const numericFields = ['weight', 'height', 'resting_hr', 'max_hr', 'age'];
  
  numericFields.forEach(field => {
    if (cleanData[field] === '' || cleanData[field] === undefined || cleanData[field] === null) {
      delete cleanData[field];
    } else {
      cleanData[field] = parseFloat(cleanData[field]);
    }
  });

  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === '') cleanData[key] = null;
  });

  return cleanData;
};

const getZoneStyles = (zone) => {
  const styles = {
    "Z5": "text-racing-red bg-racing-red/10 border-racing-red/20 scale-105 shadow-lg",
    "Z4": "text-orange-500 bg-orange-500/5 border-orange-500/10",
    "Z3": "text-yellow-500 bg-yellow-500/5 border-white/5",
    "Z2": "text-blue-400 bg-blue-400/5 border-white/5",
    "Z1": "text-green-500 bg-green-500/5 border-white/5"
  };
  return styles[zone] || "text-white/50 bg-white/5 border-white/5";
};

export default function AthletePortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [allAthletes, setAllAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('athlete');
  const [processingId, setProcessingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const [selectedAthleteDetails, setSelectedAthleteDetails] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) await fetchAthleteProfile(session.user.email);
      else setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Small delay to ensure RLS policies are ready
        setTimeout(() => fetchAthleteProfile(session.user.email), 100);
      } else {
        // Only logout if we didn't have an athlete before
        if (!athlete) {
          setAthlete(null);
          setUnauthorized(false);
          setLoading(false);
        } else {
          // Session lost but athlete was loaded - retry in 2s
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: newSession } }) => {
              if (newSession?.user) {
                fetchAthleteProfile(newSession.user.email);
              }
            });
          }, 2000);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load athlete data when athlete is set
  useEffect(() => {
    if (athlete && athlete.id) {
      fetchAthleteData(athlete.id, athlete);
      if (athlete.is_coach) fetchCoachData();

      // Clean redirect after OAuth
      setTimeout(() => {
        if (window.location.pathname === '/portal' && window.location.search) {
          navigate('/portal', { replace: true });
        }
      }, 500);
    }
  }, [athlete?.id, navigate]);

  const fetchAthleteProfile = async (email, retryCount = 0) => {
    try {
      const { data, error } = await supabase.from('athletes').select('*').eq('email', email).limit(1);

      if (error) {
        // Retry once if there's an error
        if (retryCount < 1) {
          setTimeout(() => fetchAthleteProfile(email, retryCount + 1), 500);
          return;
        }
        setAthlete(null);
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const athleteData = data[0];
        setAthlete(athleteData);
        setUnauthorized(false);
        if (!athleteData.is_coach && activeTab === 'coach') setActiveTab('athlete');
        setProfileForm({
          first_name: athleteData.first_name || '', last_name: athleteData.last_name || '', dni: athleteData.dni || '', phone: athleteData.phone || '',
          emergency_contact_name: athleteData.emergency_contact_name || '', emergency_phone_1: athleteData.emergency_phone_1 || '',
          emergency_phone_2: athleteData.emergency_phone_2 || '',
          pb_5k: athleteData.pb_5k || '', pb_10k: athleteData.pb_10k || '', pb_21k: athleteData.pb_21k || '', pb_42k: athleteData.pb_42k || '',
          pb_5k_date: athleteData.pb_5k_date || '', pb_10k_date: athleteData.pb_10k_date || '', pb_21k_date: athleteData.pb_21k_date || '', pb_42k_date: athleteData.pb_42k_date || '',
          resting_hr: athleteData.resting_hr || '', max_hr: athleteData.max_hr || '',
          weight: athleteData.weight || '', height: athleteData.height || '', birth_date: athleteData.birth_date || '', shirt_size: athleteData.shirt_size || '',
          intervals_athlete_id: athleteData.intervals_athlete_id || '',
          intervals_api_key: athleteData.intervals_api_key || '',
          group_tag: athleteData.group_tag || 'PRINCIPIANTE', is_vip: athleteData.is_vip || false
        });
        if (athleteData.profile_completed === false || athleteData.profile_completed === null) {
           if (!(athleteData.first_name && athleteData.dni)) setIsEditingProfile(true);
        }
        fetchAthleteData(athleteData.id, athleteData);
        if (athleteData.is_coach) {
          fetchCoachData();
        }
      } else {
        // SECURITY: Email not found in athletes table - show unauthorized state
        setAthlete(null);
        setUnauthorized(true);
        setLoading(false);
      }
    } catch (err) {
      setAthlete(null);
      setUnauthorized(true);
      setLoading(false);
    }
  };

  const fetchAthleteData = async (athleteId, currentAthlete) => {
    try {
      const { data, error } = await supabase.from('workout_assignments').select('*').eq('athlete_id', athleteId).eq('status', 'PENDING').order('target_date', { ascending: true });

      if (data) {
        setPendingWorkouts(data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const checkIntervalsCompletion = async (date, athleteToUse) => {
    try {
      if (!athleteToUse) return false;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/intervals/check-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ athlete_id: athleteToUse.id, date })
      });
      if (res.ok) {
        const activities = await res.json();
        return activities.length > 0;
      }
    } catch (err) { /* Silent fail for Intervals check */ }
    return false;
  };

  const handleGoogleLogin = async () => {
    console.log(`🔵 Google login initiated`);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal`
        }
      });
      console.log(`🔵 OAuth response:`, data, error);
    } catch (err) {
      console.error('🔴 OAuth error:', err);
    }
  };

  const fetchCoachData = async () => {
    if (!athlete?.tenant_id) return;
    const { data } = await supabase
      .from('athletes')
      .select('*')
      .eq('tenant_id', athlete.tenant_id) // SECURITY FIX: filter by tenant
      .order('first_name');
    if (data) setAllAthletes(data);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProcessingId('profile');
    setSaveStatus(null);

    // Limpiamos los datos usando la lógica de sanitización diseñada
    const updateData = sanitizeAthleteData(profileForm);
    
    // PROTECCIÓN DE API KEY:
    // Si el campo de la API Key no ha sido modificado (está vacío o tiene el placeholder de encriptación),
    // lo eliminamos del objeto de actualización para no sobrescribir la llave encriptada real en la base de datos.
    if (!profileForm.intervals_api_key || profileForm.intervals_api_key === athlete.intervals_api_key) {
      delete updateData.intervals_api_key;
    }
    
    // Lógica inteligente: Si el atleta cambia su marca (PB), 
    // registramos automáticamente el día de hoy como la fecha de ese récord.
    const now = new Date().toISOString().split('T')[0];
    if (profileForm.pb_5k !== athlete.pb_5k) updateData.pb_5k_date = now;
    if (profileForm.pb_10k !== athlete.pb_10k) updateData.pb_10k_date = now;
    if (profileForm.pb_21k !== athlete.pb_21k) updateData.pb_21k_date = now;
    if (profileForm.pb_42k !== athlete.pb_42k) updateData.pb_42k_date = now;

    // Solo los atletas VIP pueden guardar su ID de sincronización de Intervals/Garmin
    if (!athlete.is_vip) {
      delete updateData.intervals_athlete_id;
      delete updateData.intervals_api_key;
    }

    updateData.profile_completed = true;

    // --- VDOT & PACE ZONES CALCULATION ---
    let paceZonesChanged = false;
    let oldPB = "";
    let newPB = "";
    if (updateData.pb_5k_date || updateData.pb_10k_date || updateData.pb_21k_date || updateData.pb_42k_date) {
      const newZones = calculatePaceZones({
        pb_5k: profileForm.pb_5k,
        pb_10k: profileForm.pb_10k,
        pb_21k: profileForm.pb_21k,
        pb_42k: profileForm.pb_42k
      });
      if (newZones) {
        updateData.zone_paces = newZones;
        paceZonesChanged = true;
      }
    }

    const { error } = await supabase
      .from('athletes')
      .update(updateData)
      .eq('email', user.email);
    
    if (!error) {
      if (paceZonesChanged) {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
          console.log(`[NOTIFY] Enviando notificación a: ${backendUrl}/api/telegram/notify-coach`);
          await fetch(`${backendUrl}/api/telegram/notify-coach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: athlete.tenant_id,
              message: `⚡ **Actualización de Ritmos**\n\nEl atleta **${athlete.first_name} ${athlete.last_name}** ha actualizado sus marcas personales.\n\nSus Zonas de Entrenamiento (Z1-Z5) han sido recalculadas automáticamente con el Método VDOT de Jack Daniels.\n\n_Puedes revisarlo en el Mando de Atleta._`
            })
          });
        } catch (err) { console.error("Error sending telegram notification", err) }
      }

      setSaveStatus('success');
      // Recargamos el perfil para que el usuario vea sus datos actualizados inmediatamente
      await fetchAthleteProfile(user.email);
      setTimeout(() => { 
        setIsEditingProfile(false); 
        setSaveStatus(null); 
      }, 1500);
    } else {
      setSaveStatus('error');
      console.error("Error al guardar en Supabase:", error);
      alert(`❌ Error del Comando: ${error.message}`);
    }
    setProcessingId(null);
  };

  const handleCoachUpdateAthlete = async (e) => {
    e.preventDefault();
    setProcessingId('coach-edit');
    const updateData = sanitizeAthleteData(editForm);
    
    // PROTECCIÓN DE API KEY (Coach):
    const prevAthlete = allAthletes.find(a => a.id === selectedAthleteDetails.id);
    if (!editForm.intervals_api_key || editForm.intervals_api_key === prevAthlete?.intervals_api_key) {
      delete updateData.intervals_api_key;
    }

    // Auto-update dates if coach changes them
    const now = new Date().toISOString().split('T')[0];
    let pbsChanged = false;
    if (editForm.pb_5k !== prevAthlete?.pb_5k) { updateData.pb_5k_date = now; pbsChanged = true; }
    if (editForm.pb_10k !== prevAthlete?.pb_10k) { updateData.pb_10k_date = now; pbsChanged = true; }
    if (editForm.pb_21k !== prevAthlete?.pb_21k) { updateData.pb_21k_date = now; pbsChanged = true; }
    if (editForm.pb_42k !== prevAthlete?.pb_42k) { updateData.pb_42k_date = now; pbsChanged = true; }

    // --- VDOT & PACE ZONES CALCULATION ---
    if (pbsChanged) {
      const newZones = calculatePaceZones({
        pb_5k: editForm.pb_5k,
        pb_10k: editForm.pb_10k,
        pb_21k: editForm.pb_21k,
        pb_42k: editForm.pb_42k
      });
      if (newZones) {
        updateData.zone_paces = newZones;
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
          console.log(`[NOTIFY] Enviando notificación a: ${backendUrl}/api/telegram/notify-coach`);
          await fetch(`${backendUrl}/api/telegram/notify-coach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: selectedAthleteDetails.tenant_id,
              message: `⚡ **Actualización de Ritmos**\n\nLas marcas personales de **${selectedAthleteDetails.first_name} ${selectedAthleteDetails.last_name}** han sido modificadas por un Coach.\n\nLas Zonas de Entrenamiento (Z1-Z5) han sido recalculadas automáticamente.`
            })
          });
        } catch (err) { console.error("Error sending telegram notification", err) }
      }
    }

    const { error } = await supabase.from('athletes').update(updateData).eq('id', selectedAthleteDetails.id);
    if (!error) {
      setAllAthletes(prev => prev.map(a => a.id === selectedAthleteDetails.id ? { ...a, ...updateData } : a));
      if (selectedAthleteDetails.id === athlete.id) await fetchAthleteProfile(user.email);
      setSelectedAthleteDetails(null);
      setEditForm(null);
      alert("✅ Comando completado: Base de datos ERRT sincronizada.");
    } else alert("❌ Error: " + error.message);
    setProcessingId(null);
  };

  const openAthleteEdit = (a) => {
    setSelectedAthleteDetails(a);
    setEditForm({
      first_name: a.first_name || '', last_name: a.last_name || '', email: a.email || '', phone: a.phone || '', dni: a.dni || '',
      group_tag: a.group_tag || 'PRINCIPIANTE', pb_5k: a.pb_5k || '', pb_10k: a.pb_10k || '', pb_21k: a.pb_21k || '', pb_42k: a.pb_42k || '',
      pb_5k_date: a.pb_5k_date || '', pb_10k_date: a.pb_10k_date || '', pb_21k_date: a.pb_21k_date || '', pb_42k_date: a.pb_42k_date || '',
      resting_hr: a.resting_hr || '', max_hr: a.max_hr || '', weight: a.weight || '', height: a.height || '', birth_date: a.birth_date || '',
      shirt_size: a.shirt_size || '', emergency_contact_name: a.emergency_contact_name || '', emergency_phone_1: a.emergency_phone_1 || '',
      emergency_phone_2: a.emergency_phone_2 || '', intervals_athlete_id: a.intervals_athlete_id || '',
      intervals_api_key: a.intervals_api_key || '',
      is_coach: a.is_coach || false, is_vip: a.is_vip || false
    });
  };

  const handleSyncGarmin = async (workout) => {
    if (!athlete.is_vip) return alert("👑 ACCESO VIP REQUERIDO: Esta función es exclusiva para deportistas del Escuadrón VIP.");
    if (!athlete.intervals_athlete_id) return alert("❌ Configura tu ID de Intervals.icu en tu perfil.");
    setProcessingId(workout.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/intervals/sync-workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ workout_id: workout.id })
      });
      if (response.ok) {
        alert("🚀 ¡Sincronizado con Garmin!");
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`❌ Error al sincronizar: ${errData.error || 'Problema desconocido'}\n\n${errData.details || ''}`);
      }
    } catch (err) {
      alert("❌ Error de red al sincronizar.");
    } finally { setProcessingId(null); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-center"><div className="space-y-4"><Loader2 className="w-12 h-12 animate-spin text-racing-red mx-auto" /><p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Sincronizando con el Satélite...</p></div></div>;

  if (unauthorized) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <AlertCircle className="w-24 h-24 text-racing-red mx-auto mb-8 animate-pulse" />
        <h1 className="lexend-title text-4xl mb-6 tracking-tighter uppercase font-black italic text-center">Acceso Denegado</h1>
        <p className="text-white/60 text-center max-w-lg mb-8 leading-relaxed">Tu email (<span className="text-racing-red font-black">{user?.email}</span>) no está autorizado en el sistema ERRT.</p>
        <p className="text-white/40 text-center max-w-lg mb-8 text-sm">Por favor, contacta al administrador del equipo para que te agregue a la base de datos de atletas.</p>
        <button onClick={() => supabase.auth.signOut()} className="bg-racing-red text-white px-12 py-6 font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-2xl italic">DESCONECTARSE</button>
    </div>
  );

  if (!athlete) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <Activity className="w-24 h-24 text-racing-red mx-auto mb-8 animate-pulse" />
        <h1 className="lexend-title text-5xl mb-3 tracking-tighter uppercase font-black italic">ERRT PORTAL</h1>
        <button onClick={handleGoogleLogin} className="bg-white text-black px-12 py-6 font-black uppercase text-xs tracking-[0.3em] hover:bg-racing-red hover:text-white transition-all shadow-2xl italic">ENTRAR AL COMANDO</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <AnimatePresence>
        {isEditingProfile && profileForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/99 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card max-w-[90rem] w-full border-racing-red shadow-2xl relative overflow-hidden flex flex-col max-h-[98vh]">
               <div className="bg-white/5 p-8 border-b border-white/5 flex justify-between items-center text-center">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-full bg-racing-red flex items-center justify-center text-3xl font-black uppercase italic shadow-2xl shadow-racing-red/40">{profileForm.first_name?.[0] || "?"}</div>
                     <div className="flex flex-col text-left">
                        <div className="flex items-center gap-3">
                           <h2 className="lexend-title text-4xl font-black uppercase tracking-tighter leading-none italic">Mi Registro de Atleta</h2>
                           {athlete.is_vip && <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />}
                        </div>
                        <p className="text-xs font-black tracking-[0.5em] text-white/40 uppercase mt-2 italic">Actualización de Ficha Personal</p>
                     </div>
                  </div>
                  <button onClick={() => setIsEditingProfile(false)} className="text-white/10 hover:text-racing-red p-4 transition-all duration-300"><XCircle className="w-10 h-10" /></button>
               </div>

               <form onSubmit={handleUpdateProfile} className="p-10 lg:p-12 overflow-y-auto flex flex-col gap-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><User className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Identidad Física</h4></div>
                        <div className="grid grid-cols-1 gap-4">
                           <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">Nombre</label><input value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-bold" required /></div>
                           <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">Apellido</label><input value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-bold" required /></div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">DNI / Cédula</label><input value={profileForm.dni} onChange={e => setProfileForm({...profileForm, dni: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-mono font-bold" required /></div>
                              <div className="space-y-1"><label className="text-[11px] font-black text-racing-red/60 uppercase tracking-widest italic">Camiseta</label>
                                 <select value={profileForm.shirt_size} onChange={e => setProfileForm({...profileForm, shirt_size: e.target.value})} className="w-full bg-racing-red/10 border border-racing-red/30 rounded px-4 py-3 text-base font-black text-white uppercase appearance-none cursor-pointer">
                                    <option value="" className="text-black">-</option><option value="S" className="text-black">S</option><option value="M" className="text-black">M</option><option value="L" className="text-black">L</option><option value="XL" className="text-black">XL</option><option value="2XL" className="text-black">2XL</option><option value="3XL" className="text-black">3XL</option>
                                 </select>
                              </div>
                           </div>
                           <div className="space-y-1"><label className="text-[11px] font-black text-racing-red underline underline-offset-4 uppercase tracking-widest italic pb-1">WhatsApp de Contacto</label><input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full bg-racing-red/5 border border-racing-red/20 rounded px-4 py-3 text-base font-mono text-center text-white font-bold" placeholder="+58414..." /></div>
                        </div>
                     </div>

                     <div className="space-y-6 lg:border-l lg:border-white/5 lg:pl-12">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><ShieldCheck className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Sincronización (Sync)</h4></div>
                        <div className="space-y-4">
                           {!athlete.is_vip ? (
                             <div className="bg-racing-red/10 border border-racing-red/20 p-6 rounded-lg text-center space-y-4">
                               <Lock className="w-8 h-8 text-racing-red mx-auto" />
                               <p className="text-[10px] font-black text-racing-red uppercase tracking-widest leading-relaxed italic">TELEMETRÍA BLOQUEADA:<br />ACCESO VIP REQUERIDO PARA SYNC AUTOMÁTICA</p>
                               <p className="text-[9px] text-white/40 italic">Contacta al Coach para desbloquear la sincronización con Garmin/Coros.</p>
                             </div>
                           ) : (
                             <>
                               <div className="p-4 bg-white/[0.02] border border-white/5 rounded italic text-xs text-white/40 mb-4 tracking-tight leading-relaxed font-bold">IMPORTANTE: Conecta tu ID de Intervals.icu para cargar entrenamientos automáticamente.</div>
                               <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">ID Intervals.icu</label><input value={profileForm.intervals_athlete_id} onChange={e => setProfileForm({...profileForm, intervals_athlete_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm font-mono font-bold" /></div>
                               <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">API Key Intervals</label>
                                 <input 
                                   type="password"
                                   placeholder={athlete.intervals_api_key ? "• • • • • • • • • • • •" : "Ingresa tu API Key"} 
                                   value={profileForm.intervals_api_key === athlete.intervals_api_key ? "" : profileForm.intervals_api_key} 
                                   onChange={e => setProfileForm({...profileForm, intervals_api_key: e.target.value})} 
                                   className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm font-mono font-bold" 
                                 />
                               </div>
                               <div className="p-3 bg-white/[0.02] border border-white/5 rounded text-[10px] text-white/30 italic tracking-tight">🔒 La API Key está protegida. Al escribir una nueva se actualizará tu conexión.</div>
                             </>
                           )}
                           <div className="pt-4 border-t border-white/5 space-y-1">
                              <label className="text-[11px] font-black text-white/10 uppercase tracking-widest italic">Mi Escuadrón / Rango</label>
                              <div className="bg-white/5 p-4 rounded text-sm font-black text-racing-red/60 uppercase italic tracking-widest">{profileForm.group_tag}</div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6 lg:border-l lg:border-white/5 lg:pl-12">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><Trophy className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Biometría & Marcas</h4></div>
                        <div className="space-y-6">
                           <div className="grid grid-cols-4 gap-3 bg-black/40 p-4 rounded border border-white/5">
                              {[
                                { key: 'pb_5k', label: '5K' },
                                { key: 'pb_10k', label: '10K' },
                                { key: 'pb_21k', label: '21K' },
                                { key: 'pb_42k', label: '42K' }
                              ].map(({ key, label }) => {
                                const isLatest = [athlete.pb_5k_date, athlete.pb_10k_date, athlete.pb_21k_date, athlete.pb_42k_date]
                                  .filter(Boolean)
                                  .sort()
                                  .reverse()[0] === athlete[`${key}_date`];
                                
                                return (
                                  <div key={key} className={`space-y-1 text-center relative p-2 rounded transition-all ${isLatest ? 'bg-racing-red/10 border border-racing-red/20' : ''}`}>
                                    <label className={`text-[9px] font-black uppercase italic ${isLatest ? 'text-racing-red' : 'text-white/20'}`}>
                                      {label} {isLatest && <Zap className="w-2 h-2 inline ml-1 animate-pulse" />}
                                    </label>
                                    <input 
                                      value={profileForm[key]} 
                                      onChange={e => setProfileForm({...profileForm, [key]: e.target.value})} 
                                      className={`w-full bg-transparent rounded px-1 py-1.5 text-sm font-black italic text-center ${isLatest ? 'text-white' : 'text-white/60'}`} 
                                      placeholder="00:00" 
                                    />
                                    <input 
                                      type="date"
                                      value={profileForm[`${key}_date`]?.split('T')[0] || ""}
                                      onChange={e => setProfileForm({...profileForm, [`${key}_date`]: e.target.value})}
                                      className="w-full bg-transparent text-[11px] text-white/40 font-black uppercase text-center border-none focus:ring-0 cursor-pointer mt-1"
                                    />
                                  </div>
                                );
                              })}
                           </div>

                           <div className="p-4 bg-racing-red/5 border border-racing-red/20 rounded flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-racing-red mt-0.5" />
                              <div className="flex flex-col">
                                 <p className="text-[11px] font-black text-racing-red uppercase tracking-widest italic">Guía de Tiempos:</p>
                                 <p className="text-[10px] text-white/60 font-bold italic leading-tight">Usa MM:SS para 5K/10K y HH:MM:SS para media y maratón completa.</p>
                              </div>
                           </div>
                           
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1 text-center font-bold">
                                    <label className="text-[11px] font-black text-white/30 uppercase italic flex items-center justify-center gap-1">Peso (kg)</label>
                                    <input type="number" step="0.1" value={profileForm.weight} onChange={e => setProfileForm({...profileForm, weight: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-lg font-black text-center" />
                                 </div>
                                 <div className="space-y-1 text-center font-bold">
                                    <label className="text-[11px] font-black text-white/30 uppercase italic flex items-center justify-center gap-1">Altura (cm)</label>
                                    <input type="number" value={profileForm.height} onChange={e => setProfileForm({...profileForm, height: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-lg font-black text-center" />
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1 text-center"><label className="text-[11px] font-black text-green-500/40 uppercase italic flex items-center justify-center gap-1"><Heart className="w-4 h-4"/>FC Reposo</label><input type="number" value={profileForm.resting_hr} onChange={e => setProfileForm({...profileForm, resting_hr: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xl font-black text-green-500 text-center" /></div>
                                 <div className="space-y-1 text-center"><label className="text-[11px] font-black text-racing-red/40 uppercase italic flex items-center justify-center gap-1"><Activity className="w-4 h-4"/>FC Máxima</label><input type="number" value={profileForm.max_hr} onChange={e => setProfileForm({...profileForm, max_hr: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xl font-black text-racing-red text-center" /></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white/[0.02] p-8 rounded-lg border border-white/5 flex flex-col lg:flex-row gap-10 items-end">
                     <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><AlertCircle className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Plan de Emergencia (S.O.S)</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-2"><label className="text-[11px] font-black text-white/30 uppercase block">Contacto S.O.S</label><input value={profileForm.emergency_contact_name} onChange={e => setProfileForm({...profileForm, emergency_contact_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-5 py-4 text-base font-black uppercase italic" /></div>
                           <div className="space-y-2"><label className="text-[11px] font-black text-racing-red/40 uppercase block italic">Tel. Urgencia 1</label><input value={profileForm.emergency_phone_1} onChange={e => setProfileForm({...profileForm, emergency_phone_1: e.target.value})} className="w-full bg-racing-red/5 border border-racing-red/20 rounded px-5 py-4 text-base font-mono text-center text-white font-bold" /></div>
                           <div className="space-y-2"><label className="text-[11px] font-black text-white/30 uppercase block italic">Tel. Urgencia 2</label><input value={profileForm.emergency_phone_2} onChange={e => setProfileForm({...profileForm, emergency_phone_2: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-5 py-4 text-base font-mono text-center font-bold" /></div>
                        </div>
                     </div>
                     <button type="submit" disabled={processingId === 'profile'} className={`w-full lg:w-96 py-10 rounded-sm font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 transition-all shadow-2xl italic ${saveStatus === 'success' ? 'bg-green-600 text-white' : saveStatus === 'error' ? 'bg-racing-red text-white' : 'bg-white text-black hover:bg-racing-red hover:text-white'}`}>
                        {processingId === 'profile' ? <Loader2 className="animate-spin w-6 h-6" /> : saveStatus === 'success' ? <CheckCircle className="w-6 h-6" /> : saveStatus === 'error' ? <XCircle className="w-6 h-6" /> : <Save className="w-6 h-6" />} 
                        {saveStatus === 'success' ? 'SINCRO REALIZADA' : saveStatus === 'error' ? 'FALLO DE PERMISO' : 'ACTUALIZAR MI FICHA'}
                     </button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAthleteDetails && editForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/99 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card max-w-[95rem] w-full border-racing-red shadow-2xl relative overflow-hidden flex flex-col max-h-[98vh]">
              <div className="bg-white/5 p-8 border-b border-white/5 flex justify-between items-center text-center">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-racing-red flex items-center justify-center text-3xl font-black uppercase italic shadow-2xl shadow-racing-red/40">{editForm.first_name?.[0] || "?"}</div>
                    <div className="flex flex-col text-left text-white">
                       <h2 className="lexend-title text-4xl font-black uppercase tracking-tighter leading-none italic">Mando de Atleta</h2>
                       <p className="text-xs font-black tracking-[0.6em] text-white/40 uppercase mt-2 italic">Dossier Militar: {editForm.first_name} {editForm.last_name}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedAthleteDetails(null)} className="text-white/10 hover:text-racing-red p-4 transition-all duration-300"><XCircle className="w-10 h-10" /></button>
              </div>

              <form onSubmit={handleCoachUpdateAthlete} className="p-10 lg:p-12 overflow-y-auto flex flex-col gap-12 text-white">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><User className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Identidad Física</h4></div>
                        <div className="grid grid-cols-1 gap-4">
                           <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">Nombre</label><input value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-bold" /></div>
                           <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">Apellido</label><input value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-bold" /></div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">DNI / Cédula</label><input value={editForm.dni} onChange={e => setEditForm({...editForm, dni: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-mono font-bold" /></div>
                              <div className="space-y-1"><label className="text-[11px] font-black text-racing-red/60 uppercase tracking-widest italic">Camiseta</label>
                                 <select value={editForm.shirt_size} onChange={e => setEditForm({...editForm, shirt_size: e.target.value})} className="w-full bg-racing-red/10 border border-racing-red/30 rounded px-4 py-3 text-base font-black text-white uppercase cursor-pointer appearance-none">
                                    <option value="" className="text-black">-</option><option value="S" className="text-black">S</option><option value="M" className="text-black">M</option><option value="L" className="text-black">L</option><option value="XL" className="text-black">XL</option><option value="2XL" className="text-black">2XL</option><option value="3XL" className="text-black">3XL</option>
                                 </select>
                              </div>
                           </div>
                           <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">WhatsApp Directo</label><input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-mono text-center text-white font-bold" /></div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:border-l lg:border-white/5 lg:pl-12">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><ShieldCheck className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Rango & Sync</h4></div>
                        <div className="space-y-4">
                           <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase">Escuadrón ERRT</label>
                              <select value={editForm.group_tag} onChange={e => setEditForm({...editForm, group_tag: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm font-black text-racing-red uppercase">
                                 <option value="PRINCIPIANTE">PRINCIPIANTE</option><option value="INTERMEDIO">INTERMEDIO</option><option value="AVANZADO">AVANZADO</option><option value="ELITE">ELITE</option>
                              </select>
                           </div>
                           <div className="space-y-1"><label className="text-[11px] font-black text-white/30 uppercase tracking-widest">ID Intervals</label><input value={editForm.intervals_athlete_id} onChange={e => setEditForm({...editForm, intervals_athlete_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-base font-mono" /></div>
                           <div className="space-y-1">
                             <div className="flex justify-between items-center">
                               <label className="text-[11px] font-black text-white/30 uppercase tracking-widest">API Key Intervals</label>
                               {selectedAthleteDetails.intervals_api_key ? (
                                 <span className="text-[9px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded flex items-center gap-1 font-black italic border border-green-500/30">
                                   <CheckCircle className="w-2.5 h-2.5" /> CARGADA
                                 </span>
                               ) : (
                                 <span className="text-[9px] bg-racing-red/20 text-racing-red px-2 py-0.5 rounded flex items-center gap-1 font-black italic border border-racing-red/30">
                                   <XCircle className="w-2.5 h-2.5" /> SIN LLAVE
                                 </span>
                               )}
                             </div>
                             <input 
                               type="text" 
                               value={editForm.intervals_api_key === selectedAthleteDetails.intervals_api_key ? "" : editForm.intervals_api_key} 
                               onChange={e => setEditForm({...editForm, intervals_api_key: e.target.value})} 
                               className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm font-mono placeholder:text-white/10" 
                               placeholder={selectedAthleteDetails.intervals_api_key ? "• • • • • • • • • • • •" : "Sin API Key"}
                             />
                           </div>
                           <div className="p-3 bg-white/[0.02] border border-white/5 rounded text-[10px] text-white/30 italic">🔒 API Key gestionada encriptada. Solo ingresar si se desea sobrescribir.</div>
                           <div className="grid grid-cols-1 gap-4 mt-6">
                              <label className="flex items-center gap-5 p-5 bg-white/5 rounded border border-white/10 cursor-pointer hover:bg-racing-red/10 transition-all group">
                                 <input type="checkbox" checked={editForm.is_coach} onChange={e => setEditForm({...editForm, is_coach: e.target.checked})} className="w-6 h-6 accent-racing-red" />
                                 <div className="flex flex-col"><span className="text-sm font-black uppercase text-white tracking-widest">PANEL DE COACH</span><span className="text-[10px] text-white/30 uppercase italic">Administración Total</span></div>
                              </label>
                              <label className="flex items-center gap-5 p-5 bg-yellow-500/5 rounded border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/10 transition-all group">
                                 <input type="checkbox" checked={editForm.is_vip} onChange={e => setEditForm({...editForm, is_vip: e.target.checked})} className="w-6 h-6 accent-yellow-500" />
                                 <div className="flex flex-col"><span className="text-sm font-black uppercase text-yellow-500 tracking-widest flex items-center gap-2">RANGO VIP <Crown className="w-4 h-4"/></span><span className="text-[10px] text-yellow-500/30 uppercase italic">Acceso a Telemetría Garmin</span></div>
                              </label>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:border-l lg:border-white/5 lg:pl-12">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><Trophy className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Biometría & Marcas</h4></div>
                        <div className="space-y-6">
                           <div className="grid grid-cols-4 gap-3 bg-black/40 p-4 rounded border border-white/5">
                              {[
                                { key: 'pb_5k', label: '5K' },
                                { key: 'pb_10k', label: '10K' },
                                { key: 'pb_21k', label: '21K' },
                                { key: 'pb_42k', label: '42K' }
                              ].map(({ key, label }) => {
                                const targetAthlete = allAthletes.find(a => a.id === selectedAthleteDetails.id) || {};
                                const isLatest = [targetAthlete.pb_5k_date, targetAthlete.pb_10k_date, targetAthlete.pb_21k_date, targetAthlete.pb_42k_date]
                                  .filter(Boolean)
                                  .sort()
                                  .reverse()[0] === targetAthlete[`${key}_date`];
                                
                                return (
                                  <div key={key} className={`space-y-1 text-center relative p-1 rounded transition-all ${isLatest ? 'bg-racing-red/10 border border-racing-red/20' : ''}`}>
                                    <label className={`text-[9px] font-black uppercase italic ${isLatest ? 'text-racing-red' : 'text-white/20'}`}>{label} {isLatest && <Zap className="w-2 h-2 inline ml-1 animate-pulse" />}</label>
                                    <input 
                                      value={editForm[key]} 
                                      onChange={e => setEditForm({...editForm, [key]: e.target.value})} 
                                      className={`w-full bg-transparent border border-white/10 rounded px-1 py-1.5 text-sm font-black italic text-center ${isLatest ? 'text-white' : 'text-white/60'}`} 
                                    />
                                    <input 
                                       type="date"
                                       value={editForm[`${key}_date`]?.split('T')[0] || ""}
                                       onChange={e => setEditForm({...editForm, [`${key}_date`]: e.target.value})}
                                       className="w-full bg-transparent text-[11px] text-white/40 font-black uppercase text-center border-none focus:ring-0 cursor-pointer mt-1"
                                    />
                                  </div>
                                );
                              })}
                           </div>
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1 text-center font-bold">
                                    <label className="text-[11px] font-black text-white/30 uppercase italic flex items-center justify-center gap-1">Peso (kg)</label>
                                    <input type="number" step="0.1" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-lg font-black text-center" />
                                 </div>
                                 <div className="space-y-1 text-center font-bold">
                                    <label className="text-[11px] font-black text-white/30 uppercase italic flex items-center justify-center gap-1">Altura (cm)</label>
                                    <input type="number" value={editForm.height} onChange={e => setEditForm({...editForm, height: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-lg font-black text-center" />
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1 text-center"><label className="text-[11px] font-black text-green-500/40 uppercase italic flex items-center justify-center gap-1"><Heart className="w-4 h-4"/>FC Reposo</label><input type="number" value={editForm.resting_hr} onChange={e => setEditForm({...editForm, resting_hr: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xl font-black text-green-500 text-center" /></div>
                                 <div className="space-y-1 text-center"><label className="text-[11px] font-black text-racing-red/40 uppercase italic flex items-center justify-center gap-1"><Activity className="w-4 h-4"/>FC Máxima</label><input type="number" value={editForm.max_hr} onChange={e => setEditForm({...editForm, max_hr: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xl font-black text-racing-red text-center" /></div>
                              </div>

                              {selectedAthleteDetails.zone_paces && (
                                <div className="mt-8 space-y-3">
                                  <label className="text-[11px] font-black text-white/30 uppercase italic flex items-center justify-center gap-2">
                                    <Gauge className="w-3.5 h-3.5" /> Zonas de Ritmo (Pace)
                                  </label>
                                  <div className="grid grid-cols-5 gap-1.5">
                                    {Object.entries(selectedAthleteDetails.zone_paces).map(([z, p]) => (
                                      <div key={z} className={`flex flex-col items-center justify-center p-2 rounded border border-white/5 bg-black/20`}>
                                        <span className="text-[8px] font-black text-white/20 uppercase mb-0.5">{z}</span>
                                        <span className="text-[11px] font-mono font-black text-white/80">{p}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              </div>
                           </div>
                        </div>
                    </div>

                 <div className="bg-white/[0.02] p-10 rounded-lg border border-white/5 flex flex-col lg:flex-row gap-10 items-end">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 text-racing-red border-b border-racing-red/20 pb-3"><AlertCircle className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest italic">Plan de Emergencia (S.O.S)</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-2"><label className="text-[11px] font-black text-white/30 uppercase block">Contacto Responsable</label><input value={editForm.emergency_contact_name} onChange={e => setEditForm({...editForm, emergency_contact_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-5 py-4 text-base font-black uppercase italic" /></div>
                           <div className="space-y-2"><label className="text-[11px] font-black text-racing-red/40 uppercase block italic">Teléfono Emergencia 1</label><input value={editForm.emergency_phone_1} onChange={e => setEditForm({...editForm, emergency_phone_1: e.target.value})} className="w-full bg-racing-red/5 border border-racing-red/20 rounded px-5 py-4 text-base font-mono text-center text-racing-red font-bold" /></div>
                           <div className="space-y-2"><label className="text-[11px] font-black text-white/30 uppercase block italic">Teléfono Emergencia 2</label><input value={editForm.emergency_phone_2} onChange={e => setEditForm({...editForm, emergency_phone_2: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-5 py-4 text-base font-mono text-center font-bold" /></div>
                        </div>
                    </div>
                    <button type="submit" disabled={processingId === 'coach-edit'} className="w-full lg:w-96 bg-white text-black py-10 rounded-sm font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 hover:bg-racing-red hover:text-white transition-all shadow-2xl disabled:opacity-50 italic">GUARDAR DOSSIER</button>
                 </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 pb-8 border-b border-white/5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-racing-red font-black text-xs tracking-[0.4em] uppercase mb-4">Centro de Rendimiento ERRT</p>
          <h1 className="lexend-title text-6xl md:text-8xl lg:text-9xl uppercase font-black leading-[0.8] tracking-tighter italic flex items-center gap-6">
            HOLA,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20">{athlete.first_name}</span>
            {athlete.is_vip && <Crown className="w-16 h-16 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />}
          </h1>
          <p className="text-white/40 font-black text-sm tracking-[0.2em] mt-4 uppercase italic border-l-2 border-racing-red pl-4">{athlete.last_name}</p>
        </motion.div>

        <div className="flex flex-col items-end gap-2 text-right">
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-white/20 hover:text-racing-red transition-colors uppercase font-black tracking-[0.3em] flex items-center gap-2 mb-2">LOGOUT <XCircle className="w-3 h-3" /></button>
        </div>
      </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px mb-6">
          <div className="lg:col-start-4 lg:col-span-3 flex justify-end items-center gap-4">
            {activeTab === 'athlete' && (
              <>
                <button onClick={() => window.location.href = 'mailto:coach@errt.com'} className="text-[10px] text-white/50 border border-white/10 px-6 py-4 rounded-sm font-black hover:border-racing-red flex items-center gap-2 transition-all uppercase italic whitespace-nowrap bg-white/5 shadow-xl flex-1 justify-center"><MessageSquare className="w-4 h-4 text-racing-red" /> Hablar con el Coach</button>
                <button onClick={() => setIsEditingProfile(true)} className="text-[10px] text-white/50 border border-white/10 px-6 py-4 rounded-sm font-black hover:border-racing-red transition-all uppercase italic flex items-center gap-2 bg-white/5 shadow-xl flex-1 justify-center"><User className="w-4 h-4" /> Mi Registro</button>
              </>
            )}
            
            {athlete.is_coach && (
              <div className="bg-white/5 p-1.5 rounded-sm flex gap-1 border border-white/10 shadow-inner">
                <button onClick={() => setActiveTab('athlete')} className={`px-6 py-2.5 rounded-sm text-[10px] font-black transition-all ${activeTab === 'athlete' ? 'bg-racing-red text-white shadow-xl italic' : 'text-white/20 hover:text-white/40'}`}>ATLETA</button>
                <button onClick={() => setActiveTab('coach')} className={`px-6 py-2.5 rounded-sm text-[10px] font-black transition-all ${activeTab === 'coach' ? 'bg-racing-red text-white shadow-xl italic' : 'text-white/20'}`}>COACH</button>
              </div>
            )}
          </div>
        </div>

      {activeTab === 'athlete' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/5 border border-white/10 mb-12 rounded-sm overflow-hidden shadow-2xl">
          <div className="bg-black/40 p-8 text-center relative overflow-hidden">
             {athlete.is_vip && <Crown className="absolute -top-2 -right-2 w-12 h-12 text-yellow-500/10" />}
             <p className="text-white/20 text-[11px] uppercase font-black mb-1">Peso</p>
             <p className="lexend-title text-2xl font-black">{athlete.weight || "--"}<span className="text-[10px] text-white/20 ml-1">KG</span></p>
          </div>
          <div className="bg-black/40 p-8 text-center"><p className="text-white/20 text-[11px] uppercase font-black mb-1">Altura</p><p className="lexend-title text-2xl font-black">{athlete.height || "--"}<span className="text-[10px] text-white/20 ml-1">CM</span></p></div>
          <div className="bg-black/40 p-8 flex flex-col justify-center text-center"><p className="text-white/20 text-[11px] uppercase font-black mb-1">FC CARDIO</p><p className="lexend-title text-2xl font-black text-white"><span className="text-green-500">{athlete.resting_hr || "--"}</span><span className="text-white/10 mx-2">/</span><span className="text-racing-red">{athlete.max_hr || "--"}</span></p></div>
          <div className="bg-racing-red/10 p-8 lg:col-span-3 flex items-center justify-between border-l border-racing-red/20 leading-none">
             <div><p className="text-racing-red font-black text-[11px] uppercase tracking-widest mb-2 italic">Benchmark 5K</p><p className="lexend-title text-5xl italic tracking-tighter underline underline-offset-8 decoration-racing-red font-black">{athlete.pb_5k || "--:--"}</p></div>
             <div className="text-right"><p className="text-white/20 text-[11px] uppercase font-black mb-2">Escuadrón ERRT</p><p className="font-black text-racing-red uppercase italic tracking-tighter text-xl flex items-center gap-2">{athlete.group_tag} {athlete.is_vip && <Crown className="w-5 h-5 text-yellow-500"/>}</p></div>
          </div>
        </motion.div>
      )}

      <main>
        {activeTab === 'athlete' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              {pendingWorkouts.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center p-40 border-dashed border-white/10 border-2 text-white/10 grayscale shadow-2xl"><CheckCircle className="w-24 h-24 mb-8 opacity-20" /><h3 className="lexend-title text-3xl font-black uppercase italic tracking-tighter">Entrenamientos al Día</h3></div>
              ) : (
                pendingWorkouts.map((w, i) => {
                  const isPast = new Date(w.target_date + 'T23:59:59') < new Date();
                  const isMissed = isPast && !w.is_completed_on_intervals;
                  
                  return (
                    <motion.div key={w.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.1 }} className={`glass-card border-l-[12px] ${isMissed ? 'border-zinc-700 opacity-60' : w.is_completed_on_intervals ? 'border-green-500' : 'border-racing-red'} p-12 transition-all hover:translate-x-2 group relative overflow-hidden`}>
                      {isMissed && (
                        <div className="absolute top-0 right-0 bg-zinc-700 text-white px-6 py-2 text-[10px] font-black uppercase italic tracking-widest z-10 flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> ENTRENAMIENTO PERDIDO
                        </div>
                      )}
                      
                      {w.is_completed_on_intervals && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white px-6 py-2 text-[10px] font-black uppercase italic tracking-widest z-10 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> COMPLETADO EN INTERVALS
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${isMissed ? 'bg-zinc-600' : 'bg-racing-red animate-ping'}`} />
                        <span className={`${isMissed ? 'text-zinc-500' : 'text-racing-red'} font-black text-[10px] tracking-[0.5em] uppercase`}>{w.workout_name.split(':')[0]}</span>
                        <div className="h-px flex-1 bg-white/5 ml-4" />
                      </div>
                      
                      <h2 className={`lexend-title text-6xl md:text-7xl font-black tracking-tighter uppercase mb-6 leading-[0.9] ${isMissed ? 'text-zinc-500' : 'text-white'} italic`}>
                        {w.workout_name.includes(':') ? w.workout_name.split(':')[1] : w.workout_name}
                      </h2>
                      
                      <p className="text-[11px] text-white/30 font-black uppercase tracking-widest flex items-center gap-3 mb-12 italic">
                        <Calendar className={`w-4 h-4 ${isMissed ? 'text-zinc-500' : 'text-racing-red'}`} /> 
                        {new Date(w.target_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      
                      <div className={`monolith-code mb-12 ${isMissed ? 'text-zinc-600' : 'text-white/60'} p-10 bg-black/50 rounded-lg border border-white/5 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner`}>
                        {w.friendly_description 
                          ? w.friendly_description.replace(/\\n/g, '\n')
                          : w.markdown_payload
                              .replace(/\\n/g, '\n')
                              .replace(/ intensity=\w+/g, '') // Hide technical intensity tags
                        }
                      </div>
                      
                      {w.coach_notes && (
                        <div className={`mb-14 p-10 ${isMissed ? 'bg-zinc-900 border-zinc-700' : 'bg-racing-red/5 border-racing-red'} border-l-4 rounded-r-lg shadow-2xl`}>
                          <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className={`w-5 h-5 ${isMissed ? 'text-zinc-500' : 'text-racing-red'}`} />
                            <p className={`${isMissed ? 'text-zinc-500' : 'text-racing-red'} font-black text-[11px] uppercase tracking-widest italic`}>Instrucciones del Comando</p>
                          </div>
                          <p className={`text-[15px] ${isMissed ? 'text-zinc-600' : 'text-white/80'} italic leading-relaxed`}>"{w.coach_notes}"</p>
                        </div>
                      )}
                      
                      <div className="flex flex-col md:flex-row gap-6">
                        {isMissed ? (
                          <button onClick={() => window.location.href = 'mailto:coach@errt.com'} className="px-14 py-8 font-black uppercase text-sm tracking-[0.2em] transition-all duration-300 flex-1 flex items-center justify-center gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] italic bg-racing-red text-white hover:bg-white hover:text-black">
                            <MessageSquare className="w-5 h-5" /> RE-AGENDAR CON EL COACH
                          </button>
                        ) : (
                          <button onClick={() => handleSyncGarmin(w)} disabled={processingId === w.id} className={`px-14 py-8 font-black uppercase text-sm tracking-[0.2em] transition-all duration-300 flex-[4] flex items-center justify-center gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] italic ${!athlete.is_vip ? 'bg-zinc-800 text-white/20 cursor-not-allowed grayscale' : 'bg-white text-black hover:bg-racing-red hover:text-white'}`}>
                            {processingId === w.id ? 'SINCRO EN CURSO...' : !athlete.is_vip ? 'DESBLOQUEAR TELEMETRÍA VIP' : 'SINCRONIZAR GARMIN'} 
                            {!athlete.is_vip ? <Lock className="w-5 h-5" /> : <Zap className={processingId === w.id ? 'animate-pulse' : ''} />}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <aside className="lg:col-span-4 space-y-12">
              <div className="glass-card p-12 border-white/5 shadow-2xl transition-all duration-700 hover:border-racing-red/40 border-t-4 border-t-racing-red">
                <h4 className="text-racing-red font-black text-[11px] uppercase tracking-[0.4em] mb-12 font-inter border-b border-racing-red/10 pb-6 flex items-center gap-4 italic">
                  <Gauge className="w-5 h-5" /> Zonas de Entrenamiento
                </h4>
                <div className="space-y-6">
                  {athlete.zone_paces ? Object.entries(athlete.zone_paces).reverse().map(([z, p]) => (
                    <div key={z} className={`flex justify-between items-center p-6 rounded border transition-all duration-500 ${getZoneStyles(z)}`}>
                      <span className="font-black text-sm italic tracking-[0.1em]">{z}</span>
                      <span className="font-mono text-base font-black tracking-widest uppercase">{p}</span>
                    </div>
                  )) : <p className="text-[10px] text-white/10 uppercase font-black italic">No configuradas</p>}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="glass-card p-14 border-l-[10px] border-racing-red shadow-2xl relative overflow-hidden"><Activity className="absolute -bottom-6 -right-6 w-32 h-32 opacity-5 text-white"/><p className="text-white/20 text-[11px] uppercase font-black tracking-widest mb-6">Escuadrón Registrado</p><p className="lexend-title text-9xl font-black italic leading-none">{allAthletes.length}</p></div>
               <div className="glass-card p-14 border-l-[10px] border-yellow-500 shadow-2xl relative overflow-hidden"><Crown className="absolute -bottom-6 -right-6 w-32 h-32 opacity-5 text-yellow-500"/><p className="text-yellow-500/40 text-[11px] uppercase font-black tracking-widest mb-6">Escuadrón VIP</p><p className="lexend-title text-9xl font-black italic leading-none text-yellow-500">{allAthletes.filter(a => a.is_vip).length}</p></div>
            </div>
            <div className="glass-card overflow-hidden shadow-2xl border-white/5"><div className="p-12 border-b border-white/5 bg-white/[0.03] flex justify-between items-center"><h3 className="lexend-title text-3xl font-black uppercase tracking-tighter italic">Centro de Inteligencia ERRT</h3></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white/5 text-[10px] uppercase font-black tracking-[0.4em] text-white/10"><tr className="border-b border-white/5"><th className="p-10">Atleta Registrado</th><th className="p-10 text-center">Rango Militar</th><th className="p-10 text-right">Comando</th></tr></thead><tbody className="divide-y divide-white/5">
                {allAthletes.map(a => (<tr key={a.id} className="group hover:bg-white/[0.03] transition-all duration-300"><td className="p-10 flex items-center gap-8"><div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center font-black group-hover:bg-racing-red group-hover:text-white group-hover:shadow-2xl transition-all duration-500 italic text-2xl shadow-inner relative">{a.first_name?.[0]}{a.is_vip && <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />}</div><div><p className="font-black text-2xl uppercase leading-tight tracking-tighter transition-colors group-hover:text-racing-red flex items-center gap-2">{a.first_name || "???"} {a.is_vip && <Crown className="w-4 h-4 text-yellow-500"/>}</p><p className="text-[11px] text-white/20 uppercase font-black tracking-widest mt-1 italic font-inter">{a.last_name || "???"}</p></div></td><td className="p-10 text-center"><span className="bg-racing-red/10 text-racing-red px-6 py-3 rounded-md text-[10px] font-black italic border border-racing-red/30">{a.group_tag}</span></td><td className="p-10 text-right"><button onClick={() => openAthleteEdit(a)} className="text-[10px] font-black tracking-widest bg-white text-black px-8 py-5 rounded-sm hover:bg-racing-red hover:text-white transition-all uppercase flex items-center gap-3 ml-auto shadow-2xl italic">ADMINISTRAR <ChevronRight className="w-4 h-4" /></button></td></tr>))}
            </tbody></table></div></div>
          </div>
        )}
      </main>
      <footer className="mt-48 text-center opacity-5 text-[10px] font-black uppercase tracking-[2em] pb-16 italic underline underline-offset-[12px] decoration-white/20">Designed by Bright Drive Solutions</footer>
    </div>
  );
}

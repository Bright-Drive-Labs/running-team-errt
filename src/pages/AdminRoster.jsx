import { useState, useEffect } from "react";
import { Users, Lock, Download, Gift, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminRoster() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [runners, setRunners] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleLogin = (e) => {
    e.preventDefault();
    fetchRoster(password);
  };

  const fetchRoster = async (passArg = password) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/admin/reports/registrations", {
        headers: {
          'x-admin-password': passArg
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setRunners(data.registrations);
        setIsAuthenticated(true);
      } else {
        alert("Contraseña incorrecta en el Servidor B2B. Acceso Denegado.");
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Error fetching roster", err);
      alert("Error conectando con el servidor Backend.");
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    const headers = "Primer_Nombre,Segundo_Nombre,Apellidos,Email,Telefono,Distancia,Talla,Pago,E_Primer_Nombre,E_Segundo_Nombre,E_Apellidos,E_Telefono,OptIn,Estatus\n";
    const rows = runners.map(r => 
      `"${r.first_name}","${r.middle_name || ''}","${r.last_name}","${r.email}","${r.phone}","${r.distance}","${r.shirt_size}","${r.paid_amount}","${r.emergency_first_name}","${r.emergency_middle_name || ''}","${r.emergency_last_name}","${r.emergency_phone}","${r.marketing_opt_in ? 'SI' : 'NO'}","${r.status}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SDB_Inscritos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[url('/174355.jpg')] bg-cover bg-center opacity-20"></div>
        <form onSubmit={handleLogin} className="relative z-10 max-w-sm w-full bg-rumbero-black/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-700 text-center">
          <Lock className="w-12 h-12 text-rumbero-red mx-auto mb-6 drop-shadow-[0_0_10px_rgba(230,25,43,0.5)]" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Bóveda de Datos</h2>
          <p className="text-slate-400 text-sm mb-8">Solo personal autorizado B2B</p>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl p-4 mb-6 text-center text-xl tracking-[0.5em] focus:border-rumbero-red outline-none transition-all placeholder:tracking-normal placeholder:text-slate-500 placeholder:text-sm"
            placeholder="Clave Operativa"
          />
          <button type="submit" className="w-full bg-rumbero-red text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(230,25,43,0.3)] hover:bg-red-700 transition-colors">
            Desbloquear
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Header Dashboard Central */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div>
            <Link to="/events" className="inline-flex items-center gap-2 text-slate-500 hover:text-rumbero-black font-bold uppercase tracking-wider text-xs mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver a la Web Pública
            </Link>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-rumbero-black flex items-center gap-3">
              <Users className="text-rumbero-red w-8 h-8 md:w-10 md:h-10" />
              Roster de Operaciones
            </h1>
            <p className="text-slate-500 font-medium mt-2">Visión global de la base de datos de inscripciones.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <button onClick={fetchRoster} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-sm text-sm uppercase tracking-wider transition-colors disabled:opacity-50">
              {loading ? 'Sincronizando...' : 'Refrescar Servidor'}
            </button>
            <button onClick={downloadCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-colors">
              <Download className="w-4 h-4" /> Exportar CSV (CRM)
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-md text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-colors opacity-50 cursor-not-allowed" title="Próximamente">
              <Gift className="w-4 h-4" /> Cumpleaños
            </button>
          </div>
        </div>

        {/* Tabla Robusta de Datos */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="w-full text-left min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Atleta (Identidad)</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Contacto Directo</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Logística</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Contacto de Emergencia</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Pagos</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Estatus Legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runners.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6">
                    <p className="font-bold text-rumbero-black text-lg mb-1">{r.first_name} {r.middle_name ? r.middle_name[0]+'.' : ''} {r.last_name}</p>
                    <div className="flex gap-2">
                       <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{r.email}</span>
                       {r.marketing_opt_in && <span className="text-xs font-bold text-rumbero-red bg-red-50 px-2 py-1 rounded" title="Aceptó Publicidad B2B">🛒 OPT-IN</span>}
                    </div>
                  </td>
                  <td className="p-6 border-r border-slate-50">
                    <p className="font-bold text-slate-700">{r.phone}</p>
                  </td>
                  <td className="p-6 border-r border-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm font-black tracking-widest">{r.distance}</span>
                      <span className="text-sm font-bold text-slate-600 border border-slate-200 px-2 py-1 rounded">Talla {r.shirt_size}</span>
                    </div>
                  </td>
                  <td className="p-6 border-r border-slate-50">
                    <p className="font-bold text-slate-700 text-sm mb-1">{r.emergency_first_name} {r.emergency_last_name}</p>
                    <p className="text-xs font-bold text-red-600 uppercase flex items-center gap-1">
                      ⚠️ {r.emergency_phone}
                    </p>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-green-600 uppercase tracking-widest text-sm bg-green-50 px-3 py-1 rounded inline-block">{r.paid_amount}</p>
                  </td>
                  <td className="p-6">
                    {r.status === 'VERIFIED' ? (
                      <span className="flex w-max items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Verificado
                      </span>
                    ) : (
                      <span className="flex w-max items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-amber-200">
                         Esperando Correo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {runners.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                     <p className="text-slate-400 font-medium text-lg italic">Aún no hay registros en la base de datos B2B.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}

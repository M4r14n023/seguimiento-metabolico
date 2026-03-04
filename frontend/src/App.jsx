import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts'
import SelectorGrasaVisual from './components/SelectorGrasaVisual'

function App() {
  // --- ESTADO DEL USUARIO ACTIVO ---
  const [usuarioActivo, setUsuarioActivo] = useState('Mariano');

  // --- ESTADOS DE REGISTRO ---
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [gym, setGym] = useState(false);
  const [tenis, setTenis] = useState(false);
  const [casa, setCasa] = useState(false);
  const [historial, setHistorial] = useState([]);
  
  // --- ESTADOS DE CONFIGURACIÓN ---
  const [pesoInicial, setPesoInicial] = useState(80);
  const [cinturaInicial, setCinturaInicial] = useState(85);
  const [grasaActual, setGrasaActual] = useState(20);
  const [grasaObjetivo, setGrasaObjetivo] = useState(12);

  const API_URL = 'https://seguimiento-metabolico.onrender.com/api';

  // Al cambiar de usuario, recargamos sus datos
  useEffect(() => {
    cargarHistorial();
    cargarConfiguracion();
    // Limpiamos los inputs al cambiar de cuenta
    setPeso(''); setCintura(''); setGym(false); setTenis(false); setCasa(false);
  }, [usuarioActivo]);

  const cargarHistorial = async () => {
    try {
      const res = await axios.get(`${API_URL}/historial/${usuarioActivo}`);
      setHistorial(res.data);
    } catch (error) {
      console.error("Error al cargar el historial:", error);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const res = await axios.get(`${API_URL}/config/${usuarioActivo}`);
      if (res.data && Object.keys(res.data).length > 0) {
        setPesoInicial(res.data.peso_inicial);
        setCinturaInicial(res.data.cintura_inicial || 0);
        setGrasaActual(res.data.grasa_actual);
        setGrasaObjetivo(res.data.grasa_objetivo);
      }
    } catch (error) {
      console.error("Error al cargar la configuración:", error);
    }
  };

  const guardarConfiguracion = async () => {
    try {
      await axios.post(`${API_URL}/config`, {
        usuario: usuarioActivo,
        peso_inicial: parseFloat(pesoInicial),
        cintura_inicial: parseFloat(cinturaInicial),
        grasa_actual: parseFloat(grasaActual),
        grasa_objetivo: parseFloat(grasaObjetivo)
      });
      alert(`¡Perfil de ${usuarioActivo} guardado con éxito!`);
      cargarHistorial();
    } catch (error) {
      alert("Error al guardar el perfil");
    }
  };

  const guardarRegistro = async () => {
    if (!peso) return alert("Por favor, ingresa tu peso.");
    
    try {
      await axios.post(`${API_URL}/registrar_peso`, {
        usuario: usuarioActivo,
        peso: parseFloat(peso),
        cintura: cintura ? parseFloat(cintura) : null,
        gym: gym,
        tenis: tenis,
        casa: casa
      });
      // Reseteamos el formulario
      setPeso(''); setCintura(''); setGym(false); setTenis(false); setCasa(false);
      cargarHistorial();
    } catch (error) {
      alert("Hubo un error al guardar el registro.");
    }
  };

  const borrarRegistro = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este registro?")) return;
    try {
      await axios.delete(`${API_URL}/borrar_peso/${id}`);
      cargarHistorial();
    } catch (error) {
      console.error("Error al borrar:", error);
    }
  };

  const renderFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const partes = fechaStr.split(' ');
    return (
      <>
        <strong>{partes[0]}</strong>
        {partes[1] && <span style={{ color: '#6b7280', fontSize: '0.85em', marginLeft: '6px' }}>{partes[1]} hs</span>}
      </>
    );
  };

  // --- CÁLCULOS DEL GRÁFICO DE PESO ---
  const pesoInit = parseFloat(pesoInicial) || 0;
  const grasaAct = parseFloat(grasaActual) || 0;
  const grasaObj = parseFloat(grasaObjetivo) || 0;
  
  let pesoObjetivoCalculado = 0;
  if (pesoInit > 0 && grasaObj < 100) {
    const masaMagra = pesoInit - (pesoInit * (grasaAct / 100));
    pesoObjetivoCalculado = masaMagra / (1 - (grasaObj / 100));
  }

  let datosGraficoPeso = [];
  if (historial.length > 0) {
    const parseFecha = (fechaStr) => {
      const [año, mes, dia] = fechaStr.split(' ')[0].split('-');
      return new Date(año, mes - 1, dia);
    };

    const fechaInicio = parseFecha(historial[0].fecha);

    historial.forEach(reg => {
      const diffDias = (parseFecha(reg.fecha) - fechaInicio) / (1000 * 60 * 60 * 24);
      const semanas = diffDias / 7;
      const pesoIdeal = pesoInit * Math.pow(0.993, semanas);

      datosGraficoPeso.push({
        fecha: reg.fecha.split(' ')[0],
        peso: reg.peso,
        peso_ideal: parseFloat(pesoIdeal.toFixed(1))
      });
    });

    let fechaUltima = parseFecha(historial[historial.length - 1].fecha);
    for (let i = 1; i <= 12; i++) {
      let fechaFutura = new Date(fechaUltima);
      fechaFutura.setDate(fechaFutura.getDate() + (i * 7));
      const diffDias = (fechaFutura - fechaInicio) / (1000 * 60 * 60 * 24);
      const semanas = diffDias / 7;
      const pesoIdeal = pesoInit * Math.pow(0.993, semanas);

      const dia = String(fechaFutura.getDate()).padStart(2, '0');
      const mes = String(fechaFutura.getMonth() + 1).padStart(2, '0');
      const año = fechaFutura.getFullYear();

      datosGraficoPeso.push({
        fecha: `${año}-${mes}-${dia}`,
        peso_ideal: parseFloat(pesoIdeal.toFixed(1))
      });

      if (pesoObjetivoCalculado > 0 && pesoIdeal <= pesoObjetivoCalculado) break;
    }
  }

  return (
    <div className="app-container">
      <style>{`
        html, body { margin: 0; padding: 0; width: 100%; background-color: #f3f4f6; color: #1f2937; font-family: system-ui, -apple-system, sans-serif; }
        #root { width: 100%; display: flex; justify-content: center; }
        .app-container { max-width: 900px; width: 100%; padding: 30px 20px; box-sizing: border-box; }
        
        /* Estilos del Switcher de Usuarios */
        .user-switcher { display: flex; background: #e5e7eb; border-radius: 12px; padding: 4px; margin-bottom: 30px; }
        .user-btn { flex: 1; padding: 12px; border: none; background: transparent; font-size: 16px; font-weight: 700; color: #6b7280; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .user-btn.active { background: white; color: #111827; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        /* Botones de Actividad */
        .actividad-group { display: flex; gap: 10px; margin-top: 15px; }
        .btn-actividad { flex: 1; padding: 10px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; font-size: 18px; cursor: pointer; transition: all 0.2s; filter: grayscale(100%); opacity: 0.6; }
        .btn-actividad.active { border-color: #3b82f6; filter: grayscale(0%); opacity: 1; background: #eff6ff; }

        .titulo-principal { text-align: center; font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 20px; letter-spacing: -0.5px; }
        .card { background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 24px; border: 1px solid #f3f4f6; }
        .card-azul { background: #f0f9ff; border: 1px solid #bae6fd; }
        .card-header { font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; }
        .form-row { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-modern { padding: 10px 14px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; outline: none; background: #ffffff; color: #111827; width: 120px; }
        .btn-guardar { background: #10b981; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: 600; border-radius: 8px; cursor: pointer; height: 46px; width: 100%; margin-top: 15px;}
        .btn-perfil { background: #3b82f6; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: 600; border-radius: 8px; cursor: pointer; height: 46px; }
        .btn-borrar { background: #fee2e2; color: #ef4444; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 16px; }
        .lista-historial { list-style: none; padding: 0; margin: 0; }
        .item-historial { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; }
        .badge { padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
        .badge-peso { background: #dcfce7; color: #166534; }
        .badge-cintura { background: #fef3c7; color: #b45309; }
      `}</style>

      {/* SELECTOR DE USUARIOS */}
      <div className="user-switcher">
        <button className={`user-btn ${usuarioActivo === 'Mariano' ? 'active' : ''}`} onClick={() => setUsuarioActivo('Mariano')}>
          🧑🏻 Mariano
        </button>
        <button className={`user-btn ${usuarioActivo === 'Novia' ? 'active' : ''}`} onClick={() => setUsuarioActivo('Novia')}>
          👩🏻 Novia
        </button>
      </div>

      <h1 className="titulo-principal">📊 Seguimiento Metabólico</h1>
      
      {/* PANEL DE CONFIGURACIÓN */}
      <div className="card card-azul">
        <h3 className="card-header">⚙️ Perfil de {usuarioActivo}</h3>
        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="input-group">
            <label className="label">Peso Inicial</label>
            <input type="number" step="0.1" value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value)} className="input-modern" />
          </div>
          <div className="input-group">
            <label className="label">Cintura Inicial</label>
            <input type="number" step="0.1" value={cinturaInicial} onChange={(e) => setCinturaInicial(e.target.value)} className="input-modern" />
          </div>
          <div className="input-group">
            <label className="label">% Grasa Objetivo</label>
            <input type="number" value={grasaObjetivo} onChange={(e) => setGrasaObjetivo(e.target.value)} className="input-modern" />
          </div>
          <button onClick={guardarConfiguracion} className="btn-perfil">💾 Guardar Perfil</button>
        </div>
        <SelectorGrasaVisual grasaActual={grasaActual} setGrasaActual={setGrasaActual} />
      </div>

      {/* REGISTRO DIARIO CON ACTIVIDADES */}
      <div className="card">
        <h3 className="card-header">⚖️ Cargar Nuevo Registro</h3>
        <div className="form-row">
          <div className="input-group">
            <label className="label">Peso Actual (kg) *</label>
            <input type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} className="input-modern" placeholder="Ej: 75.5" />
          </div>
          <div className="input-group">
            <label className="label">Cintura (Opcional)</label>
            <input type="number" step="0.1" value={cintura} onChange={(e) => setCintura(e.target.value)} className="input-modern" placeholder="Hereda anterior" />
          </div>
        </div>

        <label className="label" style={{display: 'block', marginTop: '15px'}}>Actividad Física del Día (Opcional)</label>
        <div className="actividad-group">
          <button type="button" onClick={() => setGym(!gym)} className={`btn-actividad ${gym ? 'active' : ''}`}>🏋️‍♂️ Gym</button>
          <button type="button" onClick={() => setTenis(!tenis)} className={`btn-actividad ${tenis ? 'active' : ''}`}>🎾 Tenis</button>
          <button type="button" onClick={() => setCasa(!casa)} className={`btn-actividad ${casa ? 'active' : ''}`}>🏠 Casa</button>
        </div>

        <button onClick={guardarRegistro} className="btn-guardar">➕ Guardar Datos</button>
      </div>

      {/* GRÁFICO DE PESO */}
      <div className="card">
        <h3 className="card-header">📉 Evolución del Peso</h3>
        <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
          {datosGraficoPeso.length > 0 ? (
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={datosGraficoPeso} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="fecha" tick={{fontSize: 10, fill: '#374151'}} tickFormatter={(str) => str ? str.split(' ')[0] : ''} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12, fill: '#374151'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: '#1f2937' }} itemStyle={{ fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }}/>

                {pesoObjetivoCalculado > 0 && (
                  <ReferenceLine y={pesoObjetivoCalculado} label={{ position: 'top', value: `Meta: ${pesoObjetivoCalculado.toFixed(1)} kg`, fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }} stroke="#3b82f6" strokeDasharray="3 3" />
                )}
                
                <Line type="monotone" dataKey="peso_ideal" name="Curva Ideal (-0.7%)" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                <Line type="monotone" dataKey="peso" name="Mi Peso Real" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 8 }} connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>Cargando datos...</div>
          )}
        </div>
      </div>

      {/* NUEVO GRÁFICO DE CINTURA */}
      <div className="card">
        <h3 className="card-header">📏 Evolución de la Cintura</h3>
        <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
          {historial.length > 0 ? (
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={historial} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="fecha" tick={{fontSize: 10, fill: '#374151'}} tickFormatter={(str) => str ? str.split(' ')[0] : ''} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12, fill: '#374151'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: '#1f2937' }} itemStyle={{ fontWeight: 'bold' }} />
                
                <Line type="monotone" dataKey="cintura" name="Cintura (cm)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 8 }} connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>Aún no hay datos de cintura...</div>
          )}
        </div>
      </div>

      {/* HISTORIAL CON ÍCONOS DE ACTIVIDAD */}
      <div className="card">
        <h3 className="card-header">📝 Historial de Registros</h3>
        <ul className="lista-historial">
          {historial.map((reg) => (
            <li key={reg.id} className="item-historial">
              <div>
                <span className="fecha-texto">📅 {renderFecha(reg.fecha)}</span>
                <div style={{marginTop: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
                  <span className="badge badge-peso">⚖️ {reg.peso} kg</span>
                  {reg.cintura && <span className="badge badge-cintura">📏 {reg.cintura} cm</span>}
                  
                  {/* Íconos de actividad */}
                  {(reg.gym || reg.tenis || reg.casa) && (
                    <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '12px' }}>
                      {reg.gym && <span title="Gym">🏋️‍♂️</span>}
                      {reg.tenis && <span title="Tenis">🎾</span>}
                      {reg.casa && <span title="Entreno en Casa">🏠</span>}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => borrarRegistro(reg.id)} className="btn-borrar">🗑️</button>
            </li>
          ))}
          {historial.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center', paddingTop: '10px' }}>No hay registros para mostrar.</p>}
        </ul>
      </div>
    </div>
  );
}

export default App;
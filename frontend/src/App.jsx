import { useState, useEffect } from 'react'
import axios from 'axios'
// Unificamos todo en un solo import de recharts
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts'
import SelectorGrasaVisual from './components/SelectorGrasaVisual'

// El componente GraficoProgreso está perfecto como lo pegaste
const GraficoProgreso = ({ historial, pesoObjetivo }) => {
  if (historial.length === 0) return null;
  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginTop: '30px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <h3 style={{ marginBottom: '15px', color: '#1f2937', textAlign: 'center' }}>Evolución del Peso</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={historial}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="fecha" 
              tick={{fontSize: 10}} 
              tickFormatter={(str) => str.split(' ')[0]} 
            />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
            <ReferenceLine y={pesoObjetivo} label="Meta" stroke="green" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
function App() {
  const [peso, setPeso] = useState('')
  const [cintura, setCintura] = useState('')
  const [historial, setHistorial] = useState([])
  
  const [pesoInicial, setPesoInicial] = useState(80)
  const [grasaActual, setGrasaActual] = useState(20)
  const [grasaObjetivo, setGrasaObjetivo] = useState(12)
  const [proyeccion, setProyeccion] = useState([])
  const [configCargada, setConfigCargada] = useState(false)

  useEffect(() => {
    cargarConfiguracion()
    cargarHistorial()
  }, [])

  useEffect(() => {
    // Solo guardamos en la base de datos si ya trajimos los datos reales primero
    if (configCargada) {
      guardarConfiguracion()
      cargarProyeccion()
    }
  }, [pesoInicial, grasaActual, grasaObjetivo, configCargada])

  const cargarConfiguracion = async () => {
    try {
      const res = await axios.get('https://seguimiento-metabolico.onrender.com/api/config')
      setPesoInicial(res.data.peso_inicial)
      setGrasaActual(res.data.grasa_actual)
      setGrasaObjetivo(res.data.grasa_objetivo)
      // ¡Listo! Ya tenemos los datos reales, encendemos el semáforo
      setConfigCargada(true) 
    } catch (e) { console.error("Error cargando config") }
  }

  const guardarConfiguracion = async () => {
    const config = { 
      peso_inicial: parseFloat(pesoInicial), 
      grasa_actual: parseFloat(grasaActual), 
      grasa_objetivo: parseFloat(grasaObjetivo) 
    }
    await axios.post('https://seguimiento-metabolico.onrender.com/api/config', config)
  }

  const cargarHistorial = async () => {
    const res = await axios.get('https://seguimiento-metabolico.onrender.com/api/historial')
    setHistorial(res.data)
  }

  const cargarProyeccion = async () => {
    const config = { 
      peso_inicial: parseFloat(pesoInicial), 
      grasa_actual: parseFloat(grasaActual), 
      grasa_objetivo: parseFloat(grasaObjetivo) 
    }
    const res = await axios.post('https://seguimiento-metabolico.onrender.com/api/proyectar', config)
    setProyeccion(res.data.proyeccion)
  }

  const guardarRegistro = async (e) => {
    e.preventDefault()
    if (!peso) return
    
    const payload = { 
      peso: parseFloat(peso),
      cintura: cintura ? parseFloat(cintura) : null
    }

    await axios.post('https://seguimiento-metabolico.onrender.com/api/registrar_peso', payload)
    setPeso('')
    setCintura('')
    cargarHistorial() 
  }

  const borrarRegistro = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres borrar este registro?")) {
      await axios.delete(`https://seguimiento-metabolico.onrender.com/api/borrar_peso/${id}`)
      cargarHistorial()
    }
  }

  const datosGrafico = proyeccion.map((punto, index) => ({
    semana: punto.semana,
    peso_ideal: punto.peso_ideal,
    peso_real: historial[index] ? historial[index].peso : null
  }))

  // Función segura para evitar que la fecha desaparezca o rompa la app
  const renderFecha = (fechaStr) => {
    if (!fechaStr) return <span>Sin fecha</span>;
    const partes = fechaStr.split(' ');
    return (
      <>
        <strong>{partes[0]}</strong>
        {partes[1] && <span style={{ color: '#6b7280', fontSize: '0.85em', marginLeft: '6px' }}>{partes[1]} hs</span>}
      </>
    );
  }


  return (
    <div className="app-container">
      {/* --- BLOQUE DE ESTILOS CSS MODERNOS --- */}
      <style>{`
        /* Reseteamos el body y forzamos el centrado desde la raíz */
        html, body { margin: 0; padding: 0; width: 100%; background-color: #f3f4f6; color: #1f2937; font-family: system-ui, -apple-system, sans-serif; }
        
        /* #root es el contenedor invisible de React, lo obligamos a centrar su contenido */
        #root { width: 100%; display: flex; justify-content: center; }
        
        /* Nuestro contenedor ahora toma el 100% del espacio disponible hasta un máximo de 900px */
        .app-container { max-width: 900px; width: 100%; padding: 30px 20px; box-sizing: border-box; }
        
        .titulo-principal { text-align: center; font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 30px; letter-spacing: -0.5px; }
        
        .card { background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); margin-bottom: 24px; border: 1px solid #f3f4f6; }
        .card-azul { background: #f0f9ff; border: 1px solid #bae6fd; }
        
        .card-header { font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; }
        
        .form-row { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .input-modern { padding: 10px 14px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; outline: none; transition: all 0.2s; background: #fff; color: #111827; width: 120px; }
        .input-modern:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        
        .btn-guardar { background: #10b981; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s; height: 46px; }
        .btn-guardar:hover { background: #059669; }
        
        .btn-borrar { background: #fee2e2; color: #ef4444; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 16px; }
        .btn-borrar:hover { background: #ef4444; color: white; }

        .lista-historial { list-style: none; padding: 0; margin: 0; }
        .item-historial { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; }
        .item-historial:last-child { border-bottom: none; padding-bottom: 0; }
        
        .badge { padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; margin-right: 12px; }
        .badge-peso { background: #dcfce7; color: #166534; }
        .badge-cintura { background: #fef3c7; color: #b45309; }
        .fecha-texto { font-size: 16px; color: #1f2937; margin-bottom: 6px; display: block; }
      `}</style>

      <h1 className="titulo-principal">📊 Seguimiento Metabólico</h1>
      
      {/* PANEL DE CONFIGURACIÓN */}
      <div className="card card-azul">
        <h3 className="card-header">⚙️ Mi Perfil y Objetivos</h3>
        <div className="form-row">
          <div className="input-group">
            <label className="label">Peso Inicial (kg)</label>
            <input type="number" step="0.1" value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value)} className="input-modern" />
          </div>
          <div className="input-group">
            <label className="label">% Grasa Objetivo</label>
            <input type="number" value={grasaObjetivo} onChange={(e) => setGrasaObjetivo(e.target.value)} className="input-modern" />
          </div>
        </div>
        <SelectorGrasaVisual grasaActual={grasaActual} setGrasaActual={setGrasaActual} />
      </div>

      {/* REGISTRO DIARIO */}
      <div className="card">
        <h3 className="card-header">⚖️ Cargar Nuevo Registro</h3>
        <form onSubmit={guardarRegistro} className="form-row">
          <div className="input-group">
            <label className="label">Peso Actual (kg) *</label>
            <input 
              type="number" step="0.1" required
              value={peso} onChange={(e) => setPeso(e.target.value)} 
              placeholder="Ej. 79.5" className="input-modern"
            />
          </div>
          <div className="input-group">
            <label className="label">Cintura (cm) opcional</label>
            <input 
              type="number" step="0.1"
              value={cintura} onChange={(e) => setCintura(e.target.value)} 
              placeholder="Ej. 85.0" className="input-modern"
            />
          </div>
          <button type="submit" className="btn-guardar">Guardar Datos</button>
        </form>
      </div>

      {/* GRÁFICO */}
      <div className="card">
        <h3 className="card-header">📈 Progreso vs Proyección (0.7%)</h3>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafico} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="semana" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="peso_ideal" stroke="#9ca3af" name="Curva Ideal (kg)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="peso_real" stroke="#10b981" name="Mi Peso Real" strokeWidth={3} connectNulls activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HISTORIAL TEXTUAL */}
      <div className="card">
        <h3 className="card-header">📝 Historial de Registros</h3>
        <ul className="lista-historial">
          {historial.map((reg) => (
            <li key={reg.id} className="item-historial">
              <div>
                <span className="fecha-texto">📅 {renderFecha(reg.fecha)}</span>
                <div>
                  <span className="badge badge-peso">⚖️ {reg.peso} kg</span>
                  {reg.cintura && <span className="badge badge-cintura">📏 {reg.cintura} cm</span>}
                </div>
              </div>
              <button onClick={() => borrarRegistro(reg.id)} className="btn-borrar" title="Borrar registro">
                🗑️
              </button>
            </li>
          ))}
          {historial.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>Aún no hay registros. ¡Carga tu primer peso arriba!</p>}
        </ul>
      </div>
    </div>
  )
}
{/* Pasale el historial que ya tenés y el peso objetivo de tu configuración */}
<GraficoProgreso historial={historial} pesoObjetivo={config.peso_objetivo || 75} />

export default App
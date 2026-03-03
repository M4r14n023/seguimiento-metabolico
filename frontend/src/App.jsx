import { useState, useEffect } from 'react'
import axios from 'axios'
// Unificamos todo en un solo import de recharts
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts'
import SelectorGrasaVisual from './components/SelectorGrasaVisual'

const GraficoProgreso = ({ historial, pesoObjetivo }) => {
  // 1. Protección vital: Si no hay historial o está vacío, mostramos un mensaje en lugar de romper la app
  if (!historial || historial.length === 0) {
    return (
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginTop: '30px', textAlign: 'center', color: '#6b7280' }}>
        Aún no hay datos suficientes para generar el gráfico...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginTop: '30px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <h3 style={{ marginBottom: '15px', color: '#1f2937', textAlign: 'center' }}>Evolución del Peso</h3>
      
      {/* 2. Solución al error -1: Agregamos minHeight al contenedor */}
      <div style={{ width: '100%', height: 350, minHeight: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historial} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            
            {/* 3. Protección en el formato de fecha por si alguna viene nula */}
            <XAxis 
              dataKey="fecha" 
              tick={{fontSize: 10}} 
              tickFormatter={(str) => str ? str.split(' ')[0] : ''} 
            />
            
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            
            {/* Línea de meta */}
            {pesoObjetivo && <ReferenceLine y={pesoObjetivo} label="Meta" stroke="green" strokeDasharray="3 3" />}
            
            <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
function App() {
  // --- TUS ESTADOS (Asegúrate de tener estos nombres o cámbialos por los tuyos) ---
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [historial, setHistorial] = useState([]);
  const [pesoInicial, setPesoInicial] = useState(80);
  const [grasaActual, setGrasaActual] = useState(20);
  const [grasaObjetivo, setGrasaObjetivo] = useState(12);
  const [datosGrafico, setDatosGrafico] = useState([]);

  // --- FUNCIÓN PARA FORMATEAR FECHA ---
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

  // --- AQUÍ IRÍAN TUS FUNCIONES (useEffect, guardarRegistro, borrarRegistro) ---
  // Asegúrate de mantenerlas dentro de la función App antes del return.

  return (
    <div className="app-container">
      {/* --- BLOQUE DE ESTILOS CSS --- */}
      <style>{`
        html, body { margin: 0; padding: 0; width: 100%; background-color: #f3f4f6; color: #1f2937; font-family: system-ui, -apple-system, sans-serif; }
        #root { width: 100%; display: flex; justify-content: center; }
        .app-container { max-width: 900px; width: 100%; padding: 30px 20px; box-sizing: border-box; }
        .titulo-principal { text-align: center; font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 30px; letter-spacing: -0.5px; }
        .card { background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 24px; border: 1px solid #f3f4f6; }
        .card-azul { background: #f0f9ff; border: 1px solid #bae6fd; }
        .card-header { font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; }
        .form-row { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-modern { padding: 10px 14px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; outline: none; background: #fff; width: 120px; }
        .btn-guardar { background: #10b981; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: 600; border-radius: 8px; cursor: pointer; height: 46px; }
        .btn-borrar { background: #fee2e2; color: #ef4444; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 16px; }
        .lista-historial { list-style: none; padding: 0; margin: 0; }
        .item-historial { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; }
        .badge { padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
        .badge-peso { background: #dcfce7; color: #166534; }
        .badge-cintura { background: #fef3c7; color: #b45309; }
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
        <div className="form-row">
          <div className="input-group">
            <label className="label">Peso Actual (kg) *</label>
            <input type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} className="input-modern" />
          </div>
          <div className="input-group">
            <label className="label">Cintura (cm)</label>
            <input type="number" step="0.1" value={cintura} onChange={(e) => setCintura(e.target.value)} className="input-modern" />
          </div>
          <button onClick={() => {/* Tu función de guardar */}} className="btn-guardar">Guardar Datos</button>
        </div>
      </div>

      {/* GRÁFICO (Protegido para que no falle) */}
<div className="card">
  <h3 className="card-header">📈 Evolución y Progreso</h3>
  <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
    {/* Solo intentamos renderizar el gráfico si hay datos en el historial */}
    {historial && historial.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={historial} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="fecha" tick={{fontSize: 10}} tickFormatter={(str) => str ? str.split(' ')[0] : ''} />
          <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12}} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
          <Line type="monotone" dataKey="peso" stroke="#10b981" name="Mi Peso Real" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
        Cargando datos o esperando registros...
      </div>
    )}
  </div>
</div>

      {/* HISTORIAL */}
      <div className="card">
        <h3 className="card-header">📝 Historial de Registros</h3>
        <ul className="lista-historial">
          {historial.map((reg) => (
            <li key={reg.id} className="item-historial">
              <div>
                <span className="fecha-texto">📅 {renderFecha(reg.fecha)}</span>
                <div style={{marginTop: '8px'}}>
                  <span className="badge badge-peso">⚖️ {reg.peso} kg</span>
                  {reg.cintura && <span className="badge badge-cintura" style={{marginLeft: '10px'}}>📏 {reg.cintura} cm</span>}
                </div>
              </div>
              <button onClick={() => {/* Tu función borrar */}} className="btn-borrar">🗑️</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
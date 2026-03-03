import React, { useState } from 'react';

export default function SelectorGrasaVisual({ grasaActual, setGrasaActual }) {
  // Estado local para alternar la vista de imágenes
  const [genero, setGenero] = useState('hombre');

  // Arrays con los nombres exactos de tus archivos
  const opcionesHombre = [
    { porcentaje: 5, label: "4-5%", img: "/img/IMG_4-5.jpeg" },
    { porcentaje: 7, label: "6-7%", img: "/img/IMG_6-7.jpeg" },
    { porcentaje: 9, label: "8-10%", img: "/img/IMG_8-10.jpeg" },
    { porcentaje: 12, label: "11-12%", img: "/img/IMG_11-12.jpeg" },
    { porcentaje: 14, label: "13-15%", img: "/img/IMG_13-15.jpeg" },
    { porcentaje: 18, label: "16-19%", img: "/img/IMG_16-19.jpeg" },
    { porcentaje: 22, label: "20-24%", img: "/img/IMG_20-24.jpeg" },
    { porcentaje: 28, label: "25-30%", img: "/img/IMG_25-30.jpeg" },
    { porcentaje: 38, label: "35-40%", img: "/img/IMG_35-40.jpeg" }
  ];

  const opcionesMujer = [
    { porcentaje: 12, label: "11-12%", img: "/img/IMG_11-12_M.jpeg" },
    { porcentaje: 16, label: "15-17%", img: "/img/IMG_15-17_M.jpeg" },
    { porcentaje: 19, label: "18-20%", img: "/img/IMG_18-20_M.jpeg" },
    { porcentaje: 22, label: "21-23%", img: "/img/IMG_21-23_M.jpeg" },
    { porcentaje: 25, label: "24-26%", img: "/img/IMG_24-26_M.jpeg" },
    { porcentaje: 28, label: "27-29%", img: "/img/IMG_27-29_M.jpeg" },
    { porcentaje: 33, label: "30-35%", img: "/img/IMG_30-35_M.jpeg" },
    { porcentaje: 38, label: "36-40%", img: "/img/IMG_36-40_M.jpeg" },
    { porcentaje: 50, label: "+50%", img: "/img/IMG_+50_M.jpeg" }
  ];

  const opciones = genero === 'hombre' ? opcionesHombre : opcionesMujer;

  return (
    <div style={{ marginTop: '20px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
      
      {/* Selector de Género */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ margin: 0 }}>Selecciona tu imagen de referencia:</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setGenero('hombre')}
            style={{ 
              padding: '5px 15px', 
              cursor: 'pointer', 
              background: genero === 'hombre' ? '#2196F3' : '#e0e0e0', 
              color: genero === 'hombre' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Hombre
          </button>
          <button 
            onClick={() => setGenero('mujer')}
            style={{ 
              padding: '5px 15px', 
              cursor: 'pointer', 
              background: genero === 'mujer' ? '#E91E63' : '#e0e0e0', 
              color: genero === 'mujer' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Mujer
          </button>
        </div>
      </div>

      {/* Galería de Imágenes */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {opciones.map((opcion) => (
          <div 
            key={opcion.porcentaje}
            onClick={() => setGrasaActual(opcion.porcentaje)}
            style={{
              border: grasaActual === opcion.porcentaje ? '3px solid #4CAF50' : '1px solid #ddd',
              borderRadius: '8px',
              padding: '4px',
              cursor: 'pointer',
              width: '100px',
              textAlign: 'center',
              backgroundColor: grasaActual === opcion.porcentaje ? '#e8f5e9' : 'white',
              boxShadow: grasaActual === opcion.porcentaje ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s',
              transform: grasaActual === opcion.porcentaje ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <img 
              src={opcion.img} 
              alt={`Referencia ${opcion.label}`}
              style={{ 
                width: '100%', 
                height: '82px', // Reducimos la altura visible (de 80 a 65)
                objectFit: 'cover', // Mantenemos que cubra, pero...
                objectPosition: 'top', // ...forzamos a que muestre la parte de arriba (la cara/pecho)
                borderRadius: '4px', 
                marginBottom: '4px' 
              }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div style={{ display: 'none', height: '80px', backgroundColor: '#f5f5f5', marginBottom: '4px', borderRadius: '4px', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>
              Sin imagen
            </div>
            <strong style={{ fontSize: '14px', color: '#333' }}>{opcion.label}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
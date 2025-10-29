import React from 'react';

export default function Torneos() { return <h1>Torneos</h1>; }

/*import React, { useEffect, useState } from 'react'

function Torneos() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${apiUrl}/torneos_vigentes`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar torneos')
        return res.json()
      })
      .then(data => setTorneos(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando torneos...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  if (torneos.length === 0) return <p>No hay torneos vigentes.</p>

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Torneos Vigentes</h2>
      <ul>
        {torneos.map(torneo => (
          <li key={torneo.idTorneo} style={{ marginBottom: '1rem' }}>
            <strong>{torneo.nombre}</strong> <br />
            {torneo.descripcion} <br />
            Lugar: {torneo.lugarCelebracion} <br />
            Fecha y hora: {new Date(torneo.fechaHoraInicio).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Torneos
*/
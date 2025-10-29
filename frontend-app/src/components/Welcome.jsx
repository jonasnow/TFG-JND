import React, { useEffect, useState } from 'react'

function Welcome() {
  const [mensaje, setMensaje] = useState('Cargando...')

  useEffect(() => {
    //Llamada backend variable de entorno
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${apiUrl}/`)
      .then(res => res.json())
      .then(data => setMensaje(data.mensaje || JSON.stringify(data)))
      .catch(() => setMensaje('No se pudo conectar al backend'))
  }, [])

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏆 Bienvenido a la App de Torneos</h1>
      <p style={styles.subtitle}>{mensaje}</p>
    </div>
  )
}

const styles = {
  container: {
    textAlign: 'center',
    marginTop: '5rem',
    fontFamily: 'sans-serif',
  },
  title: {
    fontSize: '2rem',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.2rem',
    marginTop: '1rem',
    color: '#555',
  },
}

export default Welcome

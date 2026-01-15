import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Layout from './components/Layout';
import Torneos from './pages/Torneos';
import Perfil from './pages/Perfil';
import Register from './pages/Register';
import TorneoDetalle from './pages/TorneoDetalle';
import NuevoTorneo from './pages/NuevoTorneo';
import TorneoGestion from './pages/TorneoGestion';
import GestionTorneoEnCurso from './pages/GestionTorneoEnCurso';
import DetalleTorneoEnCurso from './pages/VistaTorneoEnCurso';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/torneos" element={<Layout><Torneos /></Layout>} />
        <Route path="/torneo/:slug" element={<Layout><TorneoDetalle /></Layout>} />
        <Route path="/perfil" element={<Layout><Perfil /></Layout>} />
        <Route path="/register" element={<Register />} />
        <Route path="/nuevotorneo" element={<Layout><NuevoTorneo /></Layout>} />
        <Route path="/torneo/gestion/:slug" element={<Layout><TorneoGestion /></Layout>} />
        <Route path="/torneo/:slug/en-curso" element={<Layout><GestionTorneoEnCurso/></Layout>} />
        <Route path="/torneo/:slug/en-curso/detalle" element={<Layout><DetalleTorneoEnCurso/></Layout>} />
        <Route path="*" element={<Layout><h2>404 Not Found</h2></Layout>} />
      </Routes>
    </Router>

  )
}

export default App

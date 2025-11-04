import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Layout from './components/Layout';
import Torneos from './pages/Torneos';
import Perfil from './pages/Perfil';
import Register from './pages/Register';
import TorneoDetalle from './pages/TorneoDetalle';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/torneos" element={<Layout><Torneos /></Layout>} />
        <Route path="/torneo/:slug" element={<Layout><TorneoDetalle /></Layout>} />
        <Route path="/perfil" element={<Layout><Perfil /></Layout>} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>

  )
}

export default App

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    localidad: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
  });

  const [exito, setExito] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [procesando, setProcesando] = useState(false); //espera reloj arena
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [mensaje, setMensaje] = useState("");


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (e.target.name === "email") setEmailError("");
    if (e.target.name === "password" || e.target.name === "confirmPassword") setPasswordError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError("Por favor, introduce un correo electrónico válido.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setProcesando(true);

    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      await new Promise(res => setTimeout(res, 1200));

      if (response.ok && !result.error) {
        setMensaje("Registrado correctamente.");
        setExito(true);
      } else {
        setMensaje(result.error || "Error al crear el usuario.");
        setExito(false);
      }

      setMostrarResultado(true);

    } catch (err) {
      setMensaje("Error: " + err.message);
      setExito(false);
      setMostrarResultado(true);
    } finally {
      setProcesando(false);
    }
  };


  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">
      <Navbar />
      <div className="flex flex-col items-center justify-center pt-16 pb-10 px-6">
        <div className="bg-[var(--color-bg-secondary)] shadow-md rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Registro
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Nombre", name: "nombre", type: "text", required: true },
              { label: "Apellidos", name: "apellidos", type: "text", required: true },
              { label: "Localidad", name: "localidad", type: "text" },
              { label: "Email", name: "email", type: "email", required: true, error: emailError },
              { label: "Contraseña", name: "password", type: "password", required: true },
              { label: "Confirmar contraseña", name: "confirmPassword", type: "password", required: true, error: passwordError },
              { label: "Teléfono", name: "telefono", type: "text" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block mb-1 opacity-80">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className={`w-full border rounded-lg p-2
                    bg-[var(--color-bg)] text-[var(--color-text)]
                    border-gray-300 dark:border-gray-700
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                    ${field.error ? "border-red-500" : ""}
                  `}
                />
                {field.error && <p className="text-red-500 text-sm mt-1">{field.error}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={procesando}
              className={`w-full py-2 rounded-lg font-bold text-white transition
                ${procesando
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
                }`}
            >
              {procesando ? "Registrando..." : "Registrarse"}
            </button>
          </form>
        </div>
      </div>
      {procesando && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6 w-72 text-center">
            <div className="animate-pulse text-4xl mb-3">⏳</div>
            <p>Creando cuenta...</p>
          </div>
        </div>
      )}
      {mostrarResultado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6 w-80 text-center">
            <div className={`text-4xl mb-3 ${exito ? "text-green-400" : "text-red-400"}`}>
              {exito ? "✔️" : "❌"}
            </div>
            <p className="font-medium">{mensaje}</p>

            <button
              className="mt-4 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
              onClick={() => {
                setMostrarResultado(false);
                if (exito) navigate("/login");
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
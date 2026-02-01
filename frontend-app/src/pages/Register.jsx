import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_URL } from "../api/auth";

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
  const [telefonoError, setTelefonoError] = useState("");
  const [procesando, setProcesando] = useState(false); //espera reloj arena
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [mensaje, setMensaje] = useState("");


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      if (!/^\d*$/.test(value)) return; // Solo permitir dígitos
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "email") setEmailError("");
    if (name === "password" || name === "confirmPassword") setPasswordError("");
    if (name === "telefono") setTelefonoError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //Validaciones existentes
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError("Por favor, introduce un correo electrónico válido.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    if (formData.password.length < 6 || formData.password.length > 70) {
      setPasswordError("La contraseña debe tener entre 6 y 70 caracteres.");
      return;
    }

    if (formData.telefono && formData.telefono.length < 9) {
      setTelefonoError("El teléfono debe tener al menos 9 dígitos.");
      return;
    }

    setProcesando(true);

    const payload = {
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      localidad: formData.localidad,
      email: formData.email,
      password: formData.password,
      telefono: formData.telefono
    };

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      await new Promise(res => setTimeout(res, 1200));

      if (response.ok) {
        setMensaje(result.mensaje || "Registrado correctamente.");
        setExito(true);
      } else {
        setMensaje(result.detail || "Error al crear el usuario.");
        setExito(false);
      }

      setMostrarResultado(true);

    } catch (err) {
      setMensaje("Error de conexión: " + err.message);
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
              { label: "Nombre", name: "nombre", type: "text", required: true, maxLength: 100 },
              { label: "Apellidos", name: "apellidos", type: "text", required: true, maxLength: 150 },
              { label: "Localidad", name: "localidad", type: "text", maxLength: 100 },
              { label: "Email", name: "email", type: "email", required: true, error: emailError, maxLength: 150 },
              { label: "Contraseña", name: "password", type: "password", required: true, maxLength: 70 },
              { label: "Confirmar contraseña", name: "confirmPassword", type: "password", required: true, error: passwordError, maxLength: 70 },
              { label: "Teléfono", name: "telefono", type: "text", required: true, maxLength: 20, error: telefonoError },
            ].map((field) => (
              <div key={field.name}>
                <label className="block mb-1 opacity-80">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  maxLength={field.maxLength}
                  inputMode={field.name === "telefono" ? "numeric" : undefined}
                  className={`w-full border rounded-lg p-2
                    bg-[var(--color-bg)] text-[var(--color-text)]
                    border-gray-300 dark:border-gray-700
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                    ${field.error ? "border-red-500" : ""}
                  `}
                />
                {field.maxLength && formData[field.name]?.length > field.maxLength * 0.8 && ( // Mostrar contador si se acerca al límite
                  <span className="text-xs text-gray-400 text-right block">
                    {formData[field.name].length} / {field.maxLength}
                  </span>
                )}
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
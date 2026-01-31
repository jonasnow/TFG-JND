export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
//Login de usuario
export async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", //Importante para recibir las cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      return { ok: true, data };
    } else {
      return { ok: false, error: data.detail || "Error en el login" };
    }
  } catch (err) {
    return { ok: false, error: "Error de conexión con el servidor" };
  }
}

//Registro de usuario
export async function registerUser(usuario) {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });

    const data = await res.json();

    if (res.ok) {
      return { ok: true, data };
    } else {
      return { ok: false, error: data.detail || "Error en el registro" };
    }
  } catch (err) {
    return { ok: false, error: "Error de conexión" };
  }
}

//Logout
export async function logoutUser() {
  try {
    await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include"
    });
    return { ok: true };
  } catch (err) {
    return { ok: false };
  }
}
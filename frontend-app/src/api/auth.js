const API_URL = "http://localhost:8000";

export async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok && !data.error) {
      return { ok: true, data };
    } else {
      return { ok: false, error: data.error || "Error en el login" };
    }
  } catch (err) {
    return { ok: false, error: "Error de conexión con el servidor" };
  }
}

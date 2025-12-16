import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";
import axios from "axios";
import { API_URL } from "../../config/api";
import "./LoginGoogleButton.css";

export default function LoginGoogleButton() {
  const handleLoginGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Enviamos los datos al backend
      const response = await axios.post(`${API_URL}/usuarios/login-google`, {
        nombre: user.displayName,
        correo_electronico: user.email,
        foto: user.photoURL,
      });

      console.log("Respuesta del backend:", response.data);

      // Guarda el token o lo que necesites
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("nombre", response.data.usuario.nombre);
      // Redireccionar si quieres
      // navigate("/dashboard");
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  return (
    <button
      type="button"
      className="google-login-button"
      onClick={handleLoginGoogle}
    >
      <img
        src="../assets/icons8-logo-de-google.svg"
        alt="Google Logo"
        className="google-icon"
      />
      Continúa con Google
    </button>
  );
}

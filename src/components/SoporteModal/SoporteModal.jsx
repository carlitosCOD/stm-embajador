import React, { useState } from "react";
import "./SoporteModal.css";

const SoporteModal = ({ onClose }) => {
  const [mensaje, setMensaje] = useState("");

  const correoSoporte = "noresponder@unac.edu.co";

  const enviarMensaje = () => {
    if (!mensaje.trim()) {
      alert("Escribe tu mensaje antes de enviarlo.");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario")) || {};

    // Detectar nombre y apellido con distintas posibles claves
    const nombre =
      usuario.nombre ||
      usuario.nombres ||
      usuario.name ||
      "";

    const apellido =
      usuario.apellido ||
      usuario.apellidos ||
      usuario.lastname ||
      "";

    const textoPlano = `
Solicitud enviada desde la aplicación de embajadores

Nombre: ${nombre} ${apellido}

Mensaje:
${mensaje}
`;

    const asunto = encodeURIComponent("Solicitud de soporte — Sistema Referidos");
    const cuerpo = encodeURIComponent(textoPlano);

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${correoSoporte}&su=${asunto}&body=${cuerpo}`,
      "_blank"
    );

    setMensaje("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="soporte-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="cerrar-modal" onClick={onClose}>
          ×
        </button>

        <h3>Centro de soporte</h3>

        <p className="soporte-desc">
          Describe tu solicitud y nuestro equipo te ayudará lo antes posible.
        </p>

        <textarea
          placeholder="Escribe aquí tu mensaje..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />

        <button className="btn btn-yellow" onClick={enviarMensaje}>
          Enviar mensaje
        </button>
      </div>
    </div>
  );
};

export default SoporteModal;

import React from 'react';
import './ErroeModal.css'; 

const ErrorModal = ({ mensaje, onClose }) => {
  return (
    <div className="error-modal-backdrop">
      <div className="error-modal">
        <h2>⚠️ Error</h2>
        <p>{mensaje}</p>
        <button onClick={onClose}>Aceptar</button>
      </div>
    </div>
  );
};

export default ErrorModal;

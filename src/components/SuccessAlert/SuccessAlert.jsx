    // src/components/SuccessAlert/SuccessAlert.jsx
    import React from 'react';
    import styles from './SuccessAlert.module.css';

    const SuccessAlert = ({ mensaje = 'Referido registrado satisfactoriamente', onClose, acciones = [] }) => {
    return (
        <div className={styles.alertContainer}>
        <div className={styles.alertBox}>
            {/* Ícono de verificación */}
            <div className={styles.checkIconSvg}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 512 512" fill="none">
                <path
                fill="#00C853"
                d="M255.7 32c-8.7 0-17.2 3.6-24.1 10.1l-20.4 18.9-27.3-8.5c-16.4-5.1-34.7 1.2-44.7 15.1l-16.9 23.4-28.1.3c-17.2.1-32.1 11.6-36.3 28.2l-7.1 28.1-25.1 14.2C6.7 180.7 0 196.4 0 212.9v30.4c0 16.5 6.7 32.2 18.7 43.2l21.8 20.5-4.5 28.1c-2.7 17.1 5.6 34 20.4 43.2l24.4 15.2 5.5 28.2c3.3 17 17.5 29.9 34.8 31.6l28.2 2.6 13.2 25.3c8 15.4 24.4 24.9 41.7 24.9 7.8 0 15.5-2 22.5-6l24.7-14.1 24.7 14.1c7 4 14.7 6 22.5 6 17.3 0 33.7-9.5 41.7-24.9l13.2-25.3 28.2-2.6c17.3-1.6 31.5-14.5 34.8-31.6l5.5-28.2 24.4-15.2c14.8-9.2 23.1-26.1 20.4-43.2l-4.5-28.1 21.8-20.5c12-11 18.7-26.7 18.7-43.2v-30.4c0-16.5-6.7-32.2-18.7-43.2l-25.1-23.5-7.1-28.1c-4.2-16.6-19.1-28.1-36.3-28.2l-28.1-.3-16.9-23.4c-10-13.9-28.3-20.2-44.7-15.1l-27.3 8.5-20.4-18.9C272.9 35.6 264.4 32 255.7 32zm86.1 182.6c9.3 9.3 9.3 24.4 0 33.7l-112 112c-9.3 9.3-24.4 9.3-33.7 0l-56-56c-9.3-9.3-9.3-24.4 0-33.7s24.4-9.3 33.7 0l39.2 39.2 95.2-95.2c9.3-9.3 24.4-9.3 33.7 0z"
                />
            </svg>
            </div>

            <h2>{mensaje}</h2>

            <div className={styles.botonesAlerta}>
            {acciones.map((btn, i) => (
                <button
                key={i}
                className={btn.tipo === 'primario' ? styles.btnPrimario : styles.btnSecundario}
                onClick={btn.onClick}
                >
                {btn.texto}
                </button>
            ))}
            </div>

            {onClose && (
            <button className={styles.btnPequeno} onClick={onClose}>
                Ver datos del referido
            </button>
            )}
        </div>
        </div>
    );
    };

    export default SuccessAlert;

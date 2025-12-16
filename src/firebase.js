// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAPdCOKoM-6R6U8IbVn_o21H21NSvX8FQo",
  authDomain: "registro-unac1.firebaseapp.com",
  projectId: "registro-unac1",
  storageBucket: "registro-unac1.firebasestorage.app",
  messagingSenderId: "64289836135",
  appId: "1:64289836135:web:17ee24e25deaa08682d8c2",
  measurementId: "G-N5RDRWZQG9"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Configura autenticación
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Exporta lo necesario
export { auth, provider };

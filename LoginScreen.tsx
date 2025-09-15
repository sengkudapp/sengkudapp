import React, { useState } from 'react';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

interface LoginScreenProps {
  onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack }) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailInput || !passwordInput) {
      setLoginError('Email dan password harus diisi.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      // onAuthStateChanged di App.tsx akan menangani perubahan tampilan
    } catch (error: any) {
      console.error(error.code, error.message);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setLoginError('Email atau password yang Anda masukkan salah.');
      } else if (error.code === 'auth/invalid-email') {
        setLoginError('Format email tidak valid.');
      }
      else {
        setLoginError('Terjadi kesalahan saat mencoba login.');
      }
      setPasswordInput('');
    }
  };

  return (
    <div className="login-screen-container">
      <form onSubmit={handleLoginSubmit} className="login-form">
        <h2>Login Admin</h2>
        <p>Silakan masukkan email & password untuk mengakses panel admin.</p>
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Email"
          autoFocus
          aria-label="Email Input"
        />
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Password"
          aria-label="Password Input"
        />
        <button type="submit">Login</button>
        <button type="button" onClick={onBack} className="btn-back">Kembali</button>
        {loginError && <p className="login-error">{loginError}</p>}
      </form>
    </div>
  );
};

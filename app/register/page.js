// app/register/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = '/api';

  // Cek jika sudah login, redirect ke dashboard
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.isLoggedIn) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking login:', error);
      }
    };
    checkLogin();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok!');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullname: fullname,
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setFullname('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Registrasi gagal');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan, pastikan server backend berjalan!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerRight}>
        <h2>Daftar Sekarang</h2>
        <div className={styles.subtitle}>Buat akun untuk mulai berbelanja</div>

        {success && <div className={styles.successMessage}>{success}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nama Lengkap</label>
            <div className={styles.inputGroup}>
              <i className="fas fa-user"></i>
              <input
                type="text"
                placeholder="Masukkan nama lengkap"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Username</label>
            <div className={styles.inputGroup}>
              <i className="fa-solid fa-user"></i>
              <input
                type="text"
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <div className={styles.inputGroup}>
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Konfirmasi Password</label>
            <div className={styles.inputGroup}>
              <i className="fas fa-check-circle"></i>
              <input
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.btnRegister}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Daftar Sekarang ➔'}
          </button>
        </form>

        <div className={styles.loginLink}>
          Sudah punya akun? <Link href="/login">Login disini</Link>
        </div>
      </div>
    </div>
  );
}
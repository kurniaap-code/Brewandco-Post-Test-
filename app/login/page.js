// app/login/page.js
// 🔒 IMPLEMENTASI: Brute Force (A07:2021) - Client-side protection + Google reCAPTCHA v2
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // 🔒 Tambahan untuk Brute Force
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  // 🔒 Tambahan untuk reCAPTCHA
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const API_URL = '/api';

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

    // 🔒 Load attempts dari localStorage (A07:2021)
    const savedAttempts = localStorage.getItem('loginAttempts');
    const savedBlocked = localStorage.getItem('loginBlockedUntil');
    
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts));
    }
    
    if (savedBlocked) {
      const blockTime = parseInt(savedBlocked);
      if (blockTime > Date.now()) {
        setBlockedUntil(blockTime);
      } else {
        localStorage.removeItem('loginBlockedUntil');
        localStorage.removeItem('loginAttempts');
        setAttempts(0);
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 🔒 Cek apakah user sedang di-block (A07:2021)
    if (blockedUntil && blockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000);
      setError(`Akun sementara diblokir. Coba lagi dalam ${minutesLeft} menit.`);
      return;
    }

    // 🔒 Validasi captcha sudah dicentang (A07:2021)
    if (!captchaToken) {
      setError('Silakan verifikasi captcha terlebih dahulu!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password, captchaToken }),
      });

      const data = await response.json();

      // 🔒 Reset captcha setiap selesai submit (baik sukses/gagal), captcha token sekali pakai
      recaptchaRef.current?.reset();
      setCaptchaToken(null);

      if (data.success) {
        // 🔒 Reset attempts jika login berhasil (A07:2021)
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginBlockedUntil');
        setAttempts(0);
        
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        router.push('/dashboard');
      } else {
        // 🔒 Tracking attempts untuk brute force protection (A07:2021)
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('loginAttempts', String(newAttempts));
        
        // 🔒 Jika mencapai 5 attempts, block selama 15 menit (A07:2021)
        if (newAttempts >= 5) {
          const blockTime = Date.now() + 15 * 60 * 1000;
          setBlockedUntil(blockTime);
          localStorage.setItem('loginBlockedUntil', String(blockTime));
          setError('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.');
        } else {
          setError(data.message || 'Login gagal. Coba lagi.');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      setError('Terjadi kesalahan, pastikan server backend berjalan!');
    } finally {
      setIsLoading(false);
    }
  };

  const isBlocked = !!(blockedUntil && blockedUntil > Date.now());

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginRight}>
        <h3>Login</h3>
        <div className={styles.welcomeText}>Senang bertemu denganmu lagi!</div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        
        {/* 🔒 Warning untuk brute force (A07:2021) */}
        {attempts > 0 && attempts < 5 && (
          <div className={styles.warningMessage}>
            ⚠️ Percobaan login: {attempts}/5. 
            {5 - attempts} kesempatan lagi sebelum akun diblokir sementara.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <div className={styles.inputGroup}>
              <i className="fa-solid fa-user"></i>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                // 🔒 Disable input jika blocked (A07:2021)
                disabled={isBlocked}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.inputGroup}>
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                // 🔒 Disable input jika blocked (A07:2021)
                disabled={isBlocked}
              />
            </div>
          </div>

          {/* 🔒 Google reCAPTCHA v2 (A07:2021) - lapisan tambahan anti brute force/bot */}
          {!isBlocked && (
            <div className={styles.captchaGroup}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.btnLogin}
            // 🔒 Disable button jika loading, blocked, atau captcha belum dicentang (A07:2021)
            disabled={isLoading || isBlocked || !captchaToken}
          >
            {isLoading ? 'Loading...' : 'Login →'}
          </button>
        </form>

        <div className={styles.registerLink}>
          Belum punya akun? <Link href="/register">Daftar Gratis</Link>
        </div>
      </div>
    </div>
  );
}

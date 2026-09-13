// app/admin/login/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = '/api';

    // Cek jika sudah login admin, redirect ke dashboard admin
    useEffect(() => {
        const checkAdminLogin = async () => {
            try {
                const response = await fetch(`${API_URL}/me`, {
                    credentials: 'include',
                });
                const data = await response.json();
                if (data.isLoggedIn && data.user?.role === 'admin') {
                    router.push('/admin/dashboard');
                }
            } catch (error) {
                console.error('Error checking admin login:', error);
            }
        };
        checkAdminLogin();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('admin', JSON.stringify(data.user));
                localStorage.setItem('isAdminLoggedIn', 'true');
                setSuccess(data.message + ' Redirecting ke dashboard...');

                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 1500);
            } else {
                setError(data.message || 'Login gagal!');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Terjadi kesalahan, pastikan server backend berjalan!');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginRight}>
                <h3>Admin Login</h3>
                <div className={styles.welcomeText}>Selamat datang kembali, Admin!</div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>{success}</div>}

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
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.btnLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Login →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
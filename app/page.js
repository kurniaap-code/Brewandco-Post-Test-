// app/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = 'https://brew-co-production.up.railway.app/api';

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.isLoggedIn) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking login:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: '#FED8B1',
        fontSize: '18px',
        gap: '10px',
      }}>
        <i className="fas fa-spinner fa-spin"></i>
        Loading...
      </div>
    );
  }

  return null;
}
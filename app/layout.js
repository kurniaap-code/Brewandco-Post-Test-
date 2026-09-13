// app/layout.js
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ 
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700']
});

export const metadata = {
    title: 'Daftar - Coffee',
    description: 'Buat akun untuk mulai berbelanja',
};

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <head>
                <link 
                    rel="stylesheet" 
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
                />
            </head>
            <body className={inter.className}>
                {/* Tambahkan wrapper untuk center content */}
                <div className="pageWrapper">
                    {children}
                </div>
            </body>
        </html>
    );
}
import { Oswald, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  weight: ['300', '400', '500', '700']
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono'
});

export const metadata: Metadata = {
  title: 'Southpaw',
  description: 'Southpaw - Predictions UFC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${oswald.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#050505] text-[#F0F0F0]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
import { Oswald, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import Script from 'next/script';
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
      <head>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TJWM7SN4');`}
        </Script>
      </head>
      <body className="bg-[#050505] text-[#F0F0F0]">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TJWM7SN4"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
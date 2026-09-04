import './styles/globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeHydrator } from '@/components/ui/ThemeHydrator';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans antialiased dark:bg-[#0f111c]">
        <ThemeHydrator />
        {children}
      </body>
    </html>
  );
}

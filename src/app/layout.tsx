import './styles/globals.css';
import { Urbanist, JetBrains_Mono } from 'next/font/google';
import { ThemeHydrator } from '@/components/ui/ThemeHydrator';

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
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
    <html
      lang="en"
      className={`dark ${urbanist.variable} ${jetBrainsMono.variable}`}
    >
      <body className="font-sans antialiased dark:bg-gray-900">
        <ThemeHydrator />
        {children}
      </body>
    </html>
  );
}

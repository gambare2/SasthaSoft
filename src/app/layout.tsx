import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AppProvider } from '@/context/AppProvider';
import { AppShell } from '@/components/AppShell';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'SasthaSoft - Enterprise Inventory & Operations Management',
  description: 'SasthaSoft Developer Assessment - Modern Inventory and Operations Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-workspace text-text-primary`}>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}



import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppProvider';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'SasthaSoft - Enterprise Inventory & Operations Management',
  description:
    'SasthaSoft Developer Assessment - Modern Inventory and Operations Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-workspace text-text-primary">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PodPal BOT - Admin Portal',
  description: 'Management Portal & Control Center for PodPal WhatsApp AI Assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

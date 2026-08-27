import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KEENOII Project Sentinel - Command Center',
  description: 'AI Project Portfolio Monitor & Local Developer Command Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

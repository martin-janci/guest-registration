import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guest Registration',
  description: 'Airbnb guest registration for hosts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full bg-bg text-fg antialiased">
        {children}
      </body>
    </html>
  );
}

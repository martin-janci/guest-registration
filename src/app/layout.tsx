export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The real layout (<html>, providers, fonts) lives in [locale]/layout.tsx
  // so that <html lang="…"> reflects the request locale.
  return children;
}

export const metadata = { title: 'Guest Registration' };

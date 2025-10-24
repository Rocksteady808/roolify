'use client';

import { useEffect, useState } from 'react';
import '../globals.css';

export default function ExtensionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="h-full w-full overflow-auto">
        <div className="min-h-full bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}







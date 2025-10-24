import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import TestModeBanner from "@/components/TestModeBanner";
import Footer from "@/components/Footer";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Roolify - Form Logic Builder",
  description: "Add conditional logic to your Webflow forms",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <TestModeBanner />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </AuthProvider>
        <Script id="iframe-detector" strategy="afterInteractive">
          {`
            // Check if running in iframe (Designer Extension)
            function detectIframe() {
              try {
                if (window.self !== window.top) {
                  // We're in an iframe - add class to hide sidebar
                  document.body.classList.add('in-iframe');
                  console.log('Running in iframe - hiding main sidebar');
                } else {
                  document.body.classList.remove('in-iframe');
                  console.log('Running standalone - showing main sidebar');
                }
              } catch (e) {
                // If we can't access window.top, assume we're in an iframe
                document.body.classList.add('in-iframe');
                console.log('Assuming iframe context - hiding main sidebar');
              }
            }
            
            // Run on DOM ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', detectIframe);
            } else {
              detectIframe();
            }
          `}
        </Script>
      </body>
    </html>
  );
}

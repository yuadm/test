import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'; 
import NavbarWrapper from './components/NavbarWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Annual Leave Management", 
  description: "Internal system for managing employee annual leave",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <Providers>
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
        </Providers>
      </body>
    </html>
  );
}

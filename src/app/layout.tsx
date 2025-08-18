import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { HydrationFix } from "@/components/providers/hydration-fix";
import { RSCErrorFix } from "@/components/providers/rsc-error-fix";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Office Supplies Management",
  description: "Comprehensive office supplies management system with request tracking, inventory management, and supplier orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <HydrationFix />
        <RSCErrorFix />
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

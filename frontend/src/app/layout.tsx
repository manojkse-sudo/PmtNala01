import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ToastContainer } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: { default: "NalaBase", template: "%s | NalaBase" },
  description: "Modern Electronic Medical Records for independent doctors",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3B1F5C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background">
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}

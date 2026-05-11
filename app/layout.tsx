import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Tickite Admin",
  description: "ERP Admin Panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fc] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

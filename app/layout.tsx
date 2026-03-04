import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Management Lite",
  description: "Code-based project collaboration dashboard for small teams."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


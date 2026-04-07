import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HypeOS",
  description: "Your personal operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}

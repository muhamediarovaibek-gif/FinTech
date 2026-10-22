import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Fraud Detection",
  description: "Система обнаружения мошеннических транзакций",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Header />

        {children}
      </body>
    </html>
  );
}
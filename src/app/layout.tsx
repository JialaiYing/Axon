import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axon — Study smarter, stay consistent",
  description:
    "Axon is a local-first productivity dashboard for students who struggle with distraction and consistency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: "dark" }}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

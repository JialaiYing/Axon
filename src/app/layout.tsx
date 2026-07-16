import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "Axon — Study smarter, stay consistent",
  description:
    "Axon is a local-first productivity dashboard for students who struggle with distraction and consistency.",
};

// Runs before React hydrates, directly on the raw DOM, so the correct
// theme is painted on the very first frame instead of flashing dark
// (the default) and then swapping to the user's saved light/warm choice.
const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem('axon:theme');
    var theme = stored === 'light' || stored === 'warm' ? stored : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

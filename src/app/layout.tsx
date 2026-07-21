import type { Metadata } from "next";
import { Sansation, Instrument_Sans, Fragment_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sansation = Sansation({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-display",
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Axon — Study smarter, stay consistent";
const DESCRIPTION =
  "Axon is a local-first productivity dashboard for students who struggle with distraction and consistency. Kanban, Pomodoro, flashcards, calendar, analytics, and gamified progress — no account required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Axon",
  },
  description: DESCRIPTION,
  keywords: [
    "study app",
    "productivity dashboard",
    "pomodoro timer",
    "study planner",
    "flashcards app",
    "student kanban board",
    "focus mode",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Axon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${sansation.variable} ${fragmentMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Light mode is a dashboard-only preference — the homepage
            // always renders dark, so this only reads/applies the stored
            // theme when we're not on `/`. Keeps this in sync with
            // ThemeProvider's isThemeableRoute check.
            __html: `(function(){try{if(window.location.pathname==='/'){return;}var t=localStorage.getItem('axon:theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

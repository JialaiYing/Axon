import type { Metadata } from "next";
import { Sansation, Instrument_Sans, Fragment_Mono, Inter, JetBrains_Mono } from "next/font/google";
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
  // Sansation isn't in Next's capsize metrics DB — skip auto fallback overrides.
  adjustFontFallback: false,
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

// Dashboard-only typography (see globals.css `html[data-scope="dashboard"]`)
// — the marketing site keeps Instrument Sans/Sansation/Fragment Mono above.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-dashboard-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dashboard-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Axon — Study smarter, stay consistent";
const DESCRIPTION =
  "Axon is a productivity dashboard for students who struggle with distraction and consistency. Kanban, Pomodoro, flashcards, calendar, analytics, and gamified progress — create a free account to get started.";

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
      className={`${instrumentSans.variable} ${sansation.variable} ${fragmentMono.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Light mode + the sharp-corner/Inter dashboard scope are both
            // dashboard-only — marketing/auth routes always render dark with
            // the marketing typeface. Keep in sync with ThemeProvider's
            // ALWAYS_DARK_ROUTES / isThemeableRoute check.
            __html: `(function(){try{var p=window.location.pathname;var marketing=(p==='/'||p==='/login'||p==='/privacy'||p==='/terms'||p==='/faq');if(!marketing){document.documentElement.setAttribute('data-scope','dashboard');}if(marketing){return;}var t=localStorage.getItem('axon:theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

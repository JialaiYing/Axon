import Link from "next/link";
import { Home, Moon, Shield, Sparkles } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <AppPage
      title="Settings"
      description="Preferences and configuration for your Axon workspace."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Moon className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Axon uses a single, fixed dark theme — tuned for long study sessions and low eye
            strain. A light theme isn&apos;t planned; the goal is one calm surface, not a switch
            to configure.
          </p>
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Data &amp; privacy</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Everything you create — objectives, flashcards, timers — is stored locally in this
            browser. Nothing is sent to a server, and no account is required.
          </p>
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Motion</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Animations respect your system&apos;s reduced-motion preference automatically —
            enable it in your OS accessibility settings to switch every transition to a plain
            fade.
          </p>
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Home className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Homepage</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Leave the app and return to the Axon landing page.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <Home className="h-3.5 w-3.5" />
              Back to homepage
            </Link>
          </Button>
        </Panel>
      </div>
    </AppPage>
  );
}

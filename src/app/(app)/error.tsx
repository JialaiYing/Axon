"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard route failed to render", error);
  }, [error]);

  return (
    <Panel className="mx-auto flex min-h-[360px] max-w-2xl flex-col items-center justify-center gap-4 border-danger/30 bg-danger-muted/10 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-danger-muted text-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">This section hit a recoverable error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The rest of Axon is still running. Try reloading this section; if it keeps happening, the
          console will show the exact component error.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </Panel>
  );
}

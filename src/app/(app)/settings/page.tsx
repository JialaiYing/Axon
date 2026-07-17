import Link from "next/link";
import { Home } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Preferences and configuration for your Axon workspace."
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Homepage</CardTitle>
          <CardDescription>
            Leave the app and return to the Axon landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

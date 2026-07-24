"use client";

import * as React from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Attachment } from "@/types";
import { safeExternalHttpUrl } from "@/lib/security/urls";

interface AttachmentEditorProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AttachmentEditor({ attachments, onChange }: AttachmentEditorProps) {
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);

  const add = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    const safe = safeExternalHttpUrl(trimmedUrl);
    if (!safe) {
      setUrlError("Use an http:// or https:// link.");
      return;
    }
    onChange([
      ...attachments,
      { id: createId(), name: name.trim() || "Link", url: safe },
    ]);
    setName("");
    setUrl("");
    setUrlError(null);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5 text-muted" />
        Attachments
      </Label>

      {attachments.length > 0 && (
        <ul className="space-y-1.5 rounded-md border border-border/50 bg-wash p-2 light:border-border">
          {attachments.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-accent hover:underline"
              >
                {item.name}
              </a>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => onChange(attachments.filter((a) => a.id !== item.id))}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-muted hover:text-danger"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-8 text-sm"
        />
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setUrlError(null);
          }}
          placeholder="https://..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!url.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {urlError && <p className="text-[11px] text-danger">{urlError}</p>}
    </div>
  );
}

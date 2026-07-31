"use client";

import { Clock3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FinishSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectiveTitle: string;
  onFinished: () => void;
  onKeepWorking: (extraMinutes: number) => void;
  onNotYet: () => void;
}

export function FinishSessionDialog({
  open,
  onOpenChange,
  objectiveTitle,
  onFinished,
  onKeepWorking,
  onNotYet,
}: FinishSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Work interval done
          </DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Decide what happens to this objective next.
          </DialogDescription>
        </DialogHeader>

        <p
          className="truncate rounded-md border border-border/50 bg-wash/40 px-3 py-2.5 text-[14px] font-medium text-foreground light:border-border"
          title={objectiveTitle}
        >
          {objectiveTitle}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={onFinished} className="w-full shadow-none">
            Yes, I&apos;m finished
          </Button>
          <Button
            variant="secondary"
            onClick={() => onKeepWorking(10)}
            className="w-full shadow-none"
          >
            <Clock3 className="h-3.5 w-3.5" />
            Keep working (+10m)
          </Button>
          <Button variant="outline" onClick={onNotYet} className="w-full shadow-none">
            Not yet — leave on board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

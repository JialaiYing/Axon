"use client";

import { PartyPopper, Clock3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
        <DialogHeader>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-border/50 text-muted-foreground light:border-border">
            <PartyPopper className="h-4 w-4" />
          </div>
          <DialogTitle>Time&apos;s up!</DialogTitle>
          <DialogDescription>
            Your estimated time for &ldquo;{objectiveTitle}&rdquo; just ran out. Are you finished
            with it?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onNotYet} className="shadow-none sm:mr-auto">
            Not yet, back to board
          </Button>
          <Button variant="secondary" onClick={() => onKeepWorking(10)} className="shadow-none">
            <Clock3 className="h-3.5 w-3.5" />
            Keep working (+10m)
          </Button>
          <Button onClick={onFinished} className="shadow-none">Yes, I&apos;m finished</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "relative inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative z-10 rounded-md px-3.5 py-1.5 text-sm font-medium text-muted transition-all duration-200",
        "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_4px_16px_-6px_rgba(59,130,246,0.5)] light:data-[state=active]:shadow-[0_1px_2px_rgba(23,24,28,0.15)]",
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content className={cn("focus-visible:outline-none", className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
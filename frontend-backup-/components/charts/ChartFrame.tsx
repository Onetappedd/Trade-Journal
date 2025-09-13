"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer } from "recharts";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** pixel height to guarantee a box even when parent has no height */
  height?: number; // default 360
  /** set to true if rendering inside hidden tabs/accordions */
  deferUntilMounted?: boolean;
};

export default function ChartFrame({
  children,
  className,
  height = 360,
  deferUntilMounted = false,
}: Props) {
  const [mounted, setMounted] = React.useState(!deferUntilMounted);
  React.useEffect(() => {
    if (deferUntilMounted) setMounted(true);
  }, [deferUntilMounted]);
  if (!mounted) {
    return <div className={cn("w-full", className)} style={{ height }} />;
  }
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        className
      )}
      style={{ height }}
    >
      {/* ResponsiveContainer needs a sized parent. We provide a hard height. */}
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-expect-error Recharts children */}
        {children}
      </ResponsiveContainer>
    </div>
  );
}

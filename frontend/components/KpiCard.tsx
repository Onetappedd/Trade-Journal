import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

export interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  positive?: boolean;
  negative?: boolean;
  icon?: ReactNode;
}

export function KpiCard({ title, value, description, positive, negative, icon }: KpiCardProps) {
  return (
    <Card className="w-full h-full min-h-[120px] flex flex-col justify-between p-4 sm:p-6">
      <CardHeader className="pb-1 flex flex-row items-center justify-between px-0 pt-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="pt-0 flex items-end gap-2 px-0 pb-0">
        <span
          className={clsx(
            "text-2xl sm:text-3xl font-bold leading-tight",
            positive && "text-success",
            negative && "text-destructive"
          )}
        >
          {value}
        </span>
        {positive && <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-success ml-1" />}
        {negative && <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-destructive ml-1" />}
      </CardContent>
      {description && (
        <CardDescription className="pt-1 px-0 text-xs sm:text-sm">{description}</CardDescription>
      )}
    </Card>
  );
}

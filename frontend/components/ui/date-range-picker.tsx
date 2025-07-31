"use client";
import { useState } from "react";
import { Button } from "./button";

export function DateRangePicker({ value, onChange }: {
  value: { from: Date; to: Date } | null,
  onChange: (v: { from: Date; to: Date } | null) => void
}) {
  // Placeholder: just a button to simulate date range selection
  return (
    <Button variant="outline" onClick={() => onChange({ from: new Date(), to: new Date() })}>
      {value ? `${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}` : "Date Range"}
    </Button>
  );
}

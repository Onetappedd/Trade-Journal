"use client";
import { useState } from "react";
import { Button } from "./button";

export function MultiSelect({ value, onChange, options, placeholder, className }: {
  value: string[],
  onChange: (v: string[]) => void,
  options: { value: string, label: string }[],
  placeholder?: string,
  className?: string
}) {
  // Placeholder: just a button to simulate multi-select
  return (
    <Button variant="outline" className={className} onClick={() => onChange(value.length ? [] : options.map(o => o.value))}>
      {value.length ? value.map(v => options.find(o => o.value === v)?.label).join(", ") : (placeholder || "Select")}
    </Button>
  );
}

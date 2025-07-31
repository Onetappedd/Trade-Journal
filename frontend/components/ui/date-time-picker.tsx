"use client";
import { useState } from "react";

export function DateTimePicker({ value, onChange }: { value: Date | null, onChange: (d: Date | null) => void }) {
  const [input, setInput] = useState(value ? value.toISOString().slice(0, 16) : "");
  return (
    <input
      type="datetime-local"
      className="border rounded px-2 py-1"
      value={input}
      onChange={e => {
        setInput(e.target.value);
        onChange(e.target.value ? new Date(e.target.value) : null);
      }}
    />
  );
}

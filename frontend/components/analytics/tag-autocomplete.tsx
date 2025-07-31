"use client";
import * as React from "react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface TagAutocompleteProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagAutocomplete({ value, onChange }: TagAutocompleteProps) {
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (input.length > 0) {
      fetch(`/api/trade-tags`)
        .then((res) => res.json())
        .then((tags: string[]) => {
          setSuggestions(tags.filter((t) => t.toLowerCase().includes(input.toLowerCase()) && !value.includes(t)));
        });
    } else {
      setSuggestions([]);
    }
  }, [input, value]);

  function addTag(tag: string) {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
      setInput("");
      setOpen(false);
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addTag(input.trim());
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Custom Tags</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="e.g., Scalping, Breakout, FOMO"
            className="mb-2"
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          {suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((tag) => (
                <Button
                  key={tag}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No suggestions</div>
          )}
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2 mt-1">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
            {tag} <span className="ml-1">×</span>
          </Badge>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-1">Press Enter to add a new tag or select from suggestions.</div>
    </div>
  );
}

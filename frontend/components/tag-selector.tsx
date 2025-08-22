'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  predefinedTags?: string[];
}

const DEFAULT_TAGS = [
  'Scalp',
  'Swing',
  'Day Trade',
  'Breakout',
  'Reversal',
  'Momentum',
  'Emotional',
  'FOMO',
  'Revenge Trade',
  'Planned',
  'Earnings Play',
  'Technical Analysis',
  'News Based',
  'Gap Fill',
];

export function TagSelector({
  selectedTags,
  onTagsChange,
  predefinedTags = DEFAULT_TAGS,
}: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const addCustomTag = () => {
    if (customTag.trim()) {
      addTag(customTag.trim());
      setCustomTag('');
    }
  };

  const availableTags = predefinedTags.filter((tag) => !selectedTags.includes(tag));

  return (
    <div className="space-y-3">
      <Label>Tags</Label>

      {/* Predefined Tags Selector */}
      <Select onValueChange={addTag}>
        <SelectTrigger>
          <SelectValue placeholder="Select a tag" />
        </SelectTrigger>
        <SelectContent>
          {availableTags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Tag Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom tag"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
        />
        <Button type="button" variant="outline" size="icon" onClick={addCustomTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer">
              {tag}
              <X className="ml-1 h-3 w-3 hover:text-destructive" onClick={() => removeTag(tag)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

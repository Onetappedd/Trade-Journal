'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Plus, FileText, BarChart3, TrendingUp, X } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actions = [
  {
    id: 'add-trade',
    title: 'Add Trade',
    description: 'Create a new trade entry',
    icon: Plus,
    action: 'add-trade',
    keywords: ['trade', 'add', 'new', 'create', 'entry'],
  },
  {
    id: 'import-csv',
    title: 'Import CSV',
    description: 'Import trades from CSV file',
    icon: FileText,
    action: 'import-csv',
    keywords: ['import', 'csv', 'file', 'upload', 'bulk'],
  },
  {
    id: 'analytics',
    title: 'Go to Analytics',
    description: 'View trading analytics and performance',
    icon: BarChart3,
    action: 'analytics',
    keywords: ['analytics', 'performance', 'stats', 'charts', 'metrics'],
  },
  {
    id: 'search-symbol',
    title: 'Search Symbol',
    description: 'Search for a specific trading symbol',
    icon: TrendingUp,
    action: 'search-symbol',
    keywords: ['search', 'symbol', 'ticker', 'stock', 'find'],
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const handleSelect = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    setSelectedAction(actionId);
    
    // Execute the action
    switch (action.action) {
      case 'add-trade':
        router.push('/dashboard/add-trade');
        break;
      case 'import-csv':
        router.push('/dashboard/import');
        break;
      case 'analytics':
        router.push('/dashboard/analytics');
        break;
      case 'search-symbol':
        // For search symbol, we'll prompt for input
        const symbol = prompt('Enter symbol to search:');
        if (symbol) {
          router.push(`/dashboard/trades?symbol=${encodeURIComponent(symbol)}`);
        }
        break;
    }
    
    onOpenChange(false);
    setSearch('');
    setSelectedAction(null);
  };

  const filteredActions = actions.filter(action =>
    action.keywords.some(keyword =>
      keyword.toLowerCase().includes(search.toLowerCase())
    ) ||
    action.title.toLowerCase().includes(search.toLowerCase()) ||
    action.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <CommandPrimitive className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              placeholder="Type a command or search..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onValueChange={setSearch}
            />
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <CommandPrimitive.List className="max-h-[300px] overflow-y-auto p-1">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </CommandPrimitive.Empty>
            
            {filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandPrimitive.Item
                  key={action.id}
                  value={action.id}
                  onSelect={handleSelect}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="mr-2 h-4 w-4 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </div>
                </CommandPrimitive.Item>
              );
            })}
          </CommandPrimitive.List>
          
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <span>Press ⌘K to open</span>
            <span>{filteredActions.length} actions</span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

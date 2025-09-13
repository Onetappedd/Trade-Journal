'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Bookmark, 
  ChevronDown, 
  Loader2,
  Trash2,
  Clock
} from 'lucide-react'
import { SavedScan } from '@/hooks/useSavedScans'
import { ScannerState } from '@/hooks/useScannerState'

interface SavedScansDropdownProps {
  savedScans: SavedScan[]
  onLoadScan: (scanId: string) => Promise<ScannerState | null>
}

export function SavedScansDropdown({ savedScans, onLoadScan }: SavedScansDropdownProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleLoadScan = async (scanId: string) => {
    setLoadingId(scanId)
    try {
      await onLoadScan(scanId)
    } finally {
      setLoadingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4 mr-2" />
          Saved Scans
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {savedScans.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="text-center w-full py-2">
              <p className="text-sm text-muted-foreground">No saved scans</p>
              <p className="text-xs text-muted-foreground">Save your first scan to get started</p>
            </div>
          </DropdownMenuItem>
        ) : (
          <>
            {savedScans.map((scan) => (
              <DropdownMenuItem
                key={scan.id}
                onClick={() => handleLoadScan(scan.id)}
                disabled={loadingId === scan.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium truncate">{scan.name}</span>
                    {scan.params.preset && (
                      <Badge variant="secondary" className="text-xs">
                        {scan.params.preset}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(scan.created_at)}</span>
                  </div>
                </div>
                {loadingId === scan.id && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-muted-foreground">
              {savedScans.length} saved scan{savedScans.length !== 1 ? 's' : ''}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

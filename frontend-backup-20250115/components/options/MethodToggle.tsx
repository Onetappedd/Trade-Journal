'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface MethodToggleProps {
  method: 'bs' | 'american'
  onChange: (method: 'bs' | 'american') => void
}

export function MethodToggle({ method, onChange }: MethodToggleProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <Button
          variant={method === 'bs' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('bs')}
          className="text-xs"
        >
          Black-Scholes
        </Button>
        <Button
          variant={method === 'american' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('american')}
          className="text-xs"
        >
          American
        </Button>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs space-y-2">
              <p className="font-medium">Pricing Methods</p>
              <div className="text-sm space-y-1">
                <p><strong>Black-Scholes:</strong> European-style options (no early exercise)</p>
                <p><strong>American:</strong> American-style options (early exercise possible)</p>
                <p className="text-muted-foreground">
                  U.S. equity options are American-style. Use American method for more accurate pricing.
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

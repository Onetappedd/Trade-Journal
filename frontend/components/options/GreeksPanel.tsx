'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Info } from 'lucide-react'
import { formatGreeks } from '@/lib/options/format'
import { CalculatorResults } from './OptionsCalculator'

interface GreeksPanelProps {
  greeks: CalculatorResults
  perContract: boolean
  multiplier: number
  onTogglePerContract: (perContract: boolean) => void
}

export function GreeksPanel({
  greeks,
  perContract,
  multiplier,
  onTogglePerContract
}: GreeksPanelProps) {
  const formattedGreeks = formatGreeks(greeks, perContract, multiplier)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Greeks</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="per-contract" className="text-xs text-muted-foreground">
              Per {perContract ? 'Contract' : 'Share'}
            </Label>
            <Switch
              id="per-contract"
              checked={perContract}
              onCheckedChange={onTogglePerContract}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {/* Delta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Delta (Δ)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formattedGreeks.delta.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`font-mono text-sm ${formattedGreeks.delta.className}`}>
                {formattedGreeks.delta.text}
              </span>
            </div>

            <Separator />

            {/* Gamma */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Gamma (Γ)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formattedGreeks.gamma.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`font-mono text-sm ${formattedGreeks.gamma.className}`}>
                {formattedGreeks.gamma.text}
              </span>
            </div>

            <Separator />

            {/* Theta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Theta (Θ)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formattedGreeks.theta.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`font-mono text-sm ${formattedGreeks.theta.className}`}>
                {formattedGreeks.theta.text}
              </span>
            </div>

            <Separator />

            {/* Vega */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Vega</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formattedGreeks.vega.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`font-mono text-sm ${formattedGreeks.vega.className}`}>
                {formattedGreeks.vega.text}
              </span>
            </div>

            <Separator />

            {/* Rho */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Rho (ρ)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formattedGreeks.rho.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`font-mono text-sm ${formattedGreeks.rho.className}`}>
                {formattedGreeks.rho.text}
              </span>
            </div>
          </div>
        </TooltipProvider>

        {/* Greeks Summary */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Quick Reference</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Delta:</span> Price sensitivity to underlying
            </div>
            <div>
              <span className="font-medium">Gamma:</span> Delta sensitivity to underlying
            </div>
            <div>
              <span className="font-medium">Theta:</span> Time decay (negative)
            </div>
            <div>
              <span className="font-medium">Vega:</span> Volatility sensitivity
            </div>
            <div className="col-span-2">
              <span className="font-medium">Rho:</span> Interest rate sensitivity
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

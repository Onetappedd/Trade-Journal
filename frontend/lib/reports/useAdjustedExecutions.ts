import { useMemo } from 'react';
import { adjustPriceQty, getDemoSplitFactors } from './adjustments-client';

export interface Execution {
  id: string;
  symbol: string;
  instrument_type: 'equity' | 'option' | 'future';
  side: 'buy' | 'sell' | 'short' | 'cover';
  quantity: number;
  price: number;
  timestamp: string;
  fees?: number;
  currency?: string;
  venue?: string;
  // ... other fields
}

export interface AdjustedExecution extends Execution {
  // Original values
  originalPrice: number;
  originalQuantity: number;
  
  // Adjusted values (for display)
  adjustedPrice: number;
  adjustedQuantity: number;
  
  // Split information
  splitFactor: number;
  hasAdjustments: boolean;
}

export interface UseAdjustedExecutionsOptions {
  asOfDate?: string; // ISO date string for split factor calculation
  enableAdjustments?: boolean; // Default true
  adjustmentDirection?: 'forward' | 'backward'; // Default 'forward'
}

export interface UseAdjustedExecutionsResult {
  adjustedExecutions: AdjustedExecution[];
  isLoading: boolean;
  error: string | null;
  summary: {
    totalExecutions: number;
    adjustedExecutions: number;
    symbolsWithAdjustments: string[];
  };
}

/**
 * Hook to get executions with split-adjusted values for display/reporting
 * 
 * @param executions - List of executions to adjust
 * @param options - Configuration options
 * @returns Adjusted executions with both original and adjusted values
 */
export function useAdjustedExecutions(
  executions: Execution[],
  options: UseAdjustedExecutionsOptions = {}
): UseAdjustedExecutionsResult {
  const {
    asOfDate,
    enableAdjustments = true,
    adjustmentDirection = 'forward'
  } = options;

  return useMemo(() => {
    if (!executions || executions.length === 0) {
      return {
        adjustedExecutions: [],
        isLoading: false,
        error: null,
        summary: {
          totalExecutions: 0,
          adjustedExecutions: 0,
          symbolsWithAdjustments: []
        }
      };
    }

    const adjustedExecutions: AdjustedExecution[] = [];
    const symbolsWithAdjustments = new Set<string>();
    let adjustedCount = 0;

    // Group executions by symbol for batch processing
    const executionsBySymbol = executions.reduce((acc, execution) => {
      if (!acc[execution.symbol]) {
        acc[execution.symbol] = [];
      }
      acc[execution.symbol].push(execution);
      return acc;
    }, {} as Record<string, Execution[]>);

    // Process each symbol
    for (const [symbol, symbolExecutions] of Object.entries(executionsBySymbol)) {
      // Only adjust equity executions (options are already derivative)
      const isEquity = symbolExecutions.every(exec => exec.instrument_type === 'equity');
      
      if (!enableAdjustments || !isEquity) {
        // No adjustments needed - add executions as-is
        symbolExecutions.forEach(execution => {
          adjustedExecutions.push({
            ...execution,
            originalPrice: execution.price,
            originalQuantity: execution.quantity,
            adjustedPrice: execution.price,
            adjustedQuantity: execution.quantity,
            splitFactor: 1,
            hasAdjustments: false
          });
        });
        continue;
      }

      // For equity executions, we need to calculate split factors
      // Note: In a real implementation, this would be async and require server-side processing
      // For now, we'll use a simplified approach with hardcoded factors for demo purposes
      
      // Get split factors for demo purposes
      const demoSplitFactors = getDemoSplitFactors();
      const splitFactor = demoSplitFactors[symbol] || 1;
      const hasAdjustments = splitFactor !== 1;

      if (hasAdjustments) {
        symbolsWithAdjustments.add(symbol);
        adjustedCount += symbolExecutions.length;
      }

      // Apply adjustments to each execution
      symbolExecutions.forEach(execution => {
        const { adjustedPrice, adjustedQty } = adjustPriceQty({
          price: execution.price,
          qty: execution.quantity,
          factor: splitFactor,
          direction: adjustmentDirection
        });

        adjustedExecutions.push({
          ...execution,
          originalPrice: execution.price,
          originalQuantity: execution.quantity,
          adjustedPrice,
          adjustedQuantity: adjustedQty,
          splitFactor,
          hasAdjustments
        });
      });
    }

    return {
      adjustedExecutions,
      isLoading: false,
      error: null,
      summary: {
        totalExecutions: executions.length,
        adjustedExecutions: adjustedCount,
        symbolsWithAdjustments: Array.from(symbolsWithAdjustments)
      }
    };
  }, [executions, enableAdjustments, adjustmentDirection]);
}

/**
 * Utility function to get display values for a single execution
 * This can be used for individual execution display without the hook
 */
export function getAdjustedExecution(
  execution: Execution,
  splitFactor: number = 1,
  direction: 'forward' | 'backward' = 'forward'
): AdjustedExecution {
  const { adjustedPrice, adjustedQty } = adjustPriceQty({
    price: execution.price,
    qty: execution.quantity,
    factor: splitFactor,
    direction
  });

  return {
    ...execution,
    originalPrice: execution.price,
    originalQuantity: execution.quantity,
    adjustedPrice,
    adjustedQuantity: adjustedQty,
    splitFactor,
    hasAdjustments: splitFactor !== 1
  };
}

/**
 * Utility function to format adjusted values for display
 */
export function formatAdjustedValue(
  originalValue: number,
  adjustedValue: number,
  format: 'price' | 'quantity' | 'currency' = 'price'
): string {
  const isAdjusted = originalValue !== adjustedValue;
  
  let formattedValue: string;
  switch (format) {
    case 'price':
      formattedValue = `$${adjustedValue.toFixed(2)}`;
      break;
    case 'quantity':
      formattedValue = adjustedValue.toLocaleString();
      break;
    case 'currency':
      formattedValue = `$${adjustedValue.toLocaleString()}`;
      break;
    default:
      formattedValue = adjustedValue.toString();
  }

  return isAdjusted ? `${formattedValue}*` : formattedValue;
}

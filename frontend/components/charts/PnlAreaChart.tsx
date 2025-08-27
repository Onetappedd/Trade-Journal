'use client';

import React from 'react';
import { Group } from '@visx/group';
import { AreaClosed, Line, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent, max, min } from 'd3-array';
import { format } from 'date-fns';
import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';

interface PnlDataPoint {
  date: string;
  value: number;
}

interface PnlAreaChartProps {
  data: PnlDataPoint[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  mode?: 'realized' | 'total';
  fallbackUsed?: boolean;
}

const getDate = (d: PnlDataPoint) => new Date(d.date);
const getPnlValue = (d: PnlDataPoint) => d.value;
const bisectDate = bisector<PnlDataPoint, Date>((d) => new Date(d.date)).left;

export default function PnlAreaChart({
  data,
  width,
  height,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  mode = 'realized',
  fallbackUsed = false,
}: PnlAreaChartProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    hideTooltip,
    showTooltip,
  } = useTooltip<PnlDataPoint>();

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-muted-foreground font-medium">No P&L data available</p>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <p>• Try selecting "ALL" time range</p>
            <p>• Switch to Realized P&L mode</p>
            <p>• Add some completed trades</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create scales
  const dateScale = scaleTime({
    range: [0, innerWidth],
    domain: extent(data, getDate) as [Date, Date],
  });

  // Ensure scale includes zero and has nice ticks
  const dataMin = min(data, getPnlValue) ?? 0;
  const dataMax = max(data, getPnlValue) ?? 0;
  
  // Force 0 into the domain for proper baseline
  const domainMin = Math.min(0, dataMin);
  const domainMax = Math.max(0, dataMax);
  
  const pnlValueScale = scaleLinear({
    range: [innerHeight, 0],
    domain: [domainMin, domainMax],
    nice: true,
  });

  // Compute zero baseline position in pixels
  const zeroY = pnlValueScale(0);
  
  // Check if data crosses zero
  const crossesZero = dataMin < 0 && dataMax > 0;
  
  // Derive two datasets
  const aboveData = data.map(d => ({ ...d, value: Math.max(d.value, 0) }));
  const belowData = data.map(d => ({ ...d, value: Math.min(d.value, 0) }));

  // Handle tooltip
  const handleTooltip = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
    const { x } = localPoint(event) || { x: 0 };
    const x0 = dateScale.invert(x - margin.left);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    let d = d0;
    if (d1 && getDate(d1)) {
      d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
    }
    showTooltip({
      tooltipData: d,
      tooltipLeft: x,
      tooltipTop: pnlValueScale(getPnlValue(d)) + margin.top,
    });
  };

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Define clip paths */}
          <defs>
            {/* Clip region for above zero (green area) */}
            <clipPath id="above-clip">
              <rect x={0} y={0} width={innerWidth} height={zeroY} />
            </clipPath>
            {/* Clip region for below zero (red area) */}
            <clipPath id="below-clip">
              <rect x={0} y={zeroY} width={innerWidth} height={innerHeight - zeroY} />
            </clipPath>
          </defs>

          {/* Show zero baseline only when data crosses zero */}
          {crossesZero && (
            <Line
              from={{ x: 0, y: zeroY }}
              to={{ x: innerWidth, y: zeroY }}
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.5}
            />
          )}
          
          {/* Red area (below zero) - rendered first */}
          {dataMin < 0 && (
            <g clipPath="url(#below-clip)">
              <AreaClosed<PnlDataPoint>
                data={belowData}
                x={(d) => dateScale(getDate(d)) ?? 0}
                y={(d) => pnlValueScale(getPnlValue(d)) ?? 0}
                y0={zeroY}
                yScale={pnlValueScale}
                strokeWidth={2}
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                curve={curveMonotoneX}
              />
            </g>
          )}
          
          {/* Green area (above zero) - rendered second */}
          {dataMax > 0 && (
            <g clipPath="url(#above-clip)">
              <AreaClosed<PnlDataPoint>
                data={aboveData}
                x={(d) => dateScale(getDate(d)) ?? 0}
                y={(d) => pnlValueScale(getPnlValue(d)) ?? 0}
                y0={zeroY}
                yScale={pnlValueScale}
                strokeWidth={2}
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
                curve={curveMonotoneX}
              />
            </g>
          )}
          
          {/* Invisible bar for tooltip */}
          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
        </Group>
      </svg>
      
      {/* Tooltip */}
      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }}
        >
          <div className="tabular-nums">
            <div className="font-medium">
              {format(getDate(tooltipData), 'MMM dd, yyyy')}
            </div>
            <div className={`font-bold ${getPnlValue(tooltipData) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {getPnlValue(tooltipData) >= 0 ? '+' : ''}${getPnlValue(tooltipData).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

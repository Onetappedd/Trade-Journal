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
}: PnlAreaChartProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    hideTooltip,
    showTooltip,
  } = useTooltip<PnlDataPoint>();

  // Calculate dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create scales
  const dateScale = scaleTime({
    range: [0, innerWidth],
    domain: extent(data, getDate) as [Date, Date],
  });

  const pnlValueScale = scaleLinear({
    range: [innerHeight, 0],
    domain: [min(data, getPnlValue) ?? 0, max(data, getPnlValue) ?? 0],
    nice: true,
  });

  // Calculate zero baseline position
  const zeroY = pnlValueScale(0);
  
  // Split data into positive and negative series
  const positiveData = data.map(d => ({ ...d, value: Math.max(d.value, 0) }));
  const negativeData = data.map(d => ({ ...d, value: Math.min(d.value, 0) }));
  
  // Check if data crosses zero
  const dataMin = min(data, getPnlValue) ?? 0;
  const dataMax = max(data, getPnlValue) ?? 0;
  const crossesZero = dataMin < 0 && dataMax > 0;

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
          
          {/* Positive area (green, fills down to zero) */}
          {dataMax > 0 && (
            <AreaClosed<PnlDataPoint>
              data={positiveData}
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
          )}
          
          {/* Negative area (red, fills up to zero) */}
          {dataMin < 0 && (
            <AreaClosed<PnlDataPoint>
              data={negativeData}
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

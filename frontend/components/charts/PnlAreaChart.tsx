'use client';

import React from 'react';
import { Group } from '@visx/group';
import { AreaClosed, Line, LinePath, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent, max, min } from 'd3-array';
import { format } from 'date-fns';
import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { LinearGradient } from '@visx/gradient';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { timeFormat } from 'd3-time-format';

interface PnlDataPoint {
  date: string;
  value: number;
}

interface BenchmarkData {
  spy?: Array<{ date: string; value: number }>;
  qqq?: Array<{ date: string; value: number }>;
}

interface PnlAreaChartProps {
  data: PnlDataPoint[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  mode?: 'realized' | 'total';
  fallbackUsed?: boolean;
  benchmarks?: BenchmarkData;
  showSpy?: boolean;
  showQqq?: boolean;
}

const getDate = (d: PnlDataPoint) => new Date(d.date);
const getPnlValue = (d: PnlDataPoint) => d.value;
const bisectDate = bisector<PnlDataPoint, Date>((d) => new Date(d.date)).left;

// Theme colors
export const background = '#3b6978';
export const background2 = '#204051';
export const accentColor = '#edffea';
export const accentColorDark = '#75daad';

// util
const formatDate = timeFormat("%b %d, '%y");

export default function PnlAreaChart({
  data,
  width,
  height,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  mode = 'realized',
  fallbackUsed = false,
  benchmarks,
  showSpy = false,
  showQqq = false,
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

  // Collect all dates including benchmarks for proper date scale
  const allDates: Date[] = [...data.map(getDate)];
  if (showSpy && benchmarks?.spy) {
    allDates.push(...benchmarks.spy.map(d => new Date(d.date)));
  }
  if (showQqq && benchmarks?.qqq) {
    allDates.push(...benchmarks.qqq.map(d => new Date(d.date)));
  }
  
  // Create scales
  const dateScale = scaleTime({
    range: [margin.left, innerWidth + margin.left],
    domain: extent(allDates) as [Date, Date],
  });

  // Ensure scale includes zero and has nice ticks
  const dataMin = min(data, getPnlValue) ?? 0;
  const dataMax = max(data, getPnlValue) ?? 0;
  
  // Force 0 into the domain for proper baseline
  const domainMin = Math.min(0, dataMin);
  const domainMax = Math.max(0, dataMax);
  
  const pnlValueScale = scaleLinear({
    range: [innerHeight + margin.top, margin.top],
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
    const x0 = dateScale.invert(x);
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
      tooltipTop: pnlValueScale(getPnlValue(d)),
    });
  };

  return (
    <div>
      <svg width={width} height={height}>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#area-background-gradient)"
          rx={14}
        />
        <LinearGradient id="area-background-gradient" from={background} to={background2} />
        
        <Group left={0} top={0}>
          {/* Define clip paths */}
          <defs>
            {/* Clip region for above zero (green area) */}
            <clipPath id="above-clip">
              <rect x={margin.left} y={margin.top} width={innerWidth} height={zeroY - margin.top} />
            </clipPath>
            {/* Clip region for below zero (red area) */}
            <clipPath id="below-clip">
              <rect x={margin.left} y={zeroY} width={innerWidth} height={innerHeight + margin.top - zeroY} />
            </clipPath>
          </defs>

          {/* Grid */}
          <GridRows
            left={margin.left}
            scale={pnlValueScale}
            width={innerWidth}
            strokeDasharray="1,3"
            stroke={accentColor}
            strokeOpacity={0.1}
            pointerEvents="none"
          />
          <GridColumns
            top={margin.top}
            scale={dateScale}
            height={innerHeight}
            strokeDasharray="1,3"
            stroke={accentColor}
            strokeOpacity={0.2}
            pointerEvents="none"
          />

          {/* Show zero baseline only when data crosses zero */}
          {crossesZero && (
            <Line
              from={{ x: margin.left, y: zeroY }}
              to={{ x: innerWidth + margin.left, y: zeroY }}
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
          
          {/* SPY Benchmark Line */}
          {showSpy && benchmarks?.spy && benchmarks.spy.length > 0 && (
            <LinePath
              data={benchmarks.spy}
              x={(d) => dateScale(new Date(d.date)) ?? 0}
              y={(d) => pnlValueScale(d.value) ?? 0}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5,5"
              curve={curveMonotoneX}
              opacity={0.8}
            />
          )}
          
          {/* QQQ Benchmark Line */}
          {showQqq && benchmarks?.qqq && benchmarks.qqq.length > 0 && (
            <LinePath
              data={benchmarks.qqq}
              x={(d) => dateScale(new Date(d.date)) ?? 0}
              y={(d) => pnlValueScale(d.value) ?? 0}
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5,5"
              curve={curveMonotoneX}
              opacity={0.8}
            />
          )}
          
          {/* Y-axis (P&L values) */}
          <AxisLeft
            left={margin.left}
            scale={pnlValueScale}
            stroke="#6b7280"
            strokeWidth={1}
            tickStroke="#6b7280"
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 11,
              textAnchor: 'end',
              dy: '0.33em',
            })}
            tickFormat={(value) => `$${Number(value).toLocaleString()}`}
          />
          
          {/* X-axis (dates) */}
          <AxisBottom
            top={innerHeight + margin.top}
            scale={dateScale}
            stroke="#6b7280"
            strokeWidth={1}
            tickStroke="#6b7280"
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 11,
              textAnchor: 'middle',
              dy: '0.33em',
            })}
            tickFormat={(value) => formatDate(value as Date)}
          />
          
          {/* Invisible bar for tooltip */}
          <Bar
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          
          {/* Tooltip markers */}
          {tooltipData && tooltipTop !== undefined && tooltipLeft !== undefined && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: margin.top }}
                to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                stroke={accentColorDark}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop + 1}
                r={4}
                fill="black"
                fillOpacity={0.1}
                stroke="black"
                strokeOpacity={0.1}
                strokeWidth={2}
                pointerEvents="none"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                fill={getPnlValue(tooltipData) >= 0 ? "#22c55e" : "#ef4444"}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
        </Group>
      </svg>
      
      {/* Tooltip */}
      {tooltipData && tooltipTop !== undefined && tooltipLeft !== undefined && (
        <div>
          <TooltipWithBounds
            key={Math.random()}
            top={Math.max(10, tooltipTop - 50)}
            left={Math.min(tooltipLeft + 15, width - 100)}
            style={{
              backgroundColor: getPnlValue(tooltipData) >= 0 ? '#22c55e' : '#ef4444',
              color: 'white',
              border: '1px solid white',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              position: 'absolute',
              zIndex: 1000,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {`$${getPnlValue(tooltipData).toLocaleString()}`}
          </TooltipWithBounds>
          <TooltipWithBounds
            top={innerHeight + margin.top + 15}
            left={tooltipLeft}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              textAlign: 'center',
              transform: 'translateX(-50%)',
              position: 'absolute',
              zIndex: 1000,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {formatDate(getDate(tooltipData))}
          </TooltipWithBounds>
        </div>
      )}
    </div>
  );
}

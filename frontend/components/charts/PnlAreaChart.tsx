'use client';

import React, { useMemo, useCallback } from 'react';
import { AreaClosed, Line, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import { withTooltip, Tooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { max, extent, bisector, min } from 'd3-array';
import { timeFormat } from 'd3-time-format';

// P&L data point interface
interface PnlDataPoint {
  date: string;
  value: number;
}

type TooltipData = PnlDataPoint;

// Theme colors
export const background = '#3b6978';
export const background2 = '#204051';
export const accentColor = '#edffea';
export const accentColorDark = '#75daad';
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: '1px solid white',
  color: 'white',
};

// util
const formatDate = timeFormat("%b %d, '%y");

// accessors
const getDate = (d: PnlDataPoint) => new Date(d.date);
const getPnlValue = (d: PnlDataPoint) => d.value;
const bisectDate = bisector<PnlDataPoint, Date>((d) => new Date(d.date)).left;

export type PnlAreaChartProps = {
  data: PnlDataPoint[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  mode?: 'realized' | 'total';
  fallbackUsed?: boolean;
};

export default withTooltip<PnlAreaChartProps, TooltipData>(
  ({
    data,
    width,
    height,
    margin = { top: 20, right: 20, bottom: 40, left: 60 },
    mode = 'realized',
    fallbackUsed = false,
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  }: PnlAreaChartProps & WithTooltipProvidedProps<TooltipData>) => {
    // Handle empty or invalid data with friendly empty state
    if (width < 10 || !data || data.length === 0) {
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

    // bounds
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Calculate data bounds for smart scaling
    const dataMin = min(data, getPnlValue) || 0;
    const dataMax = max(data, getPnlValue) || 0;
    const dataRange = dataMax - dataMin;
    
    // Determine if we should show zero baseline
    const shouldShowZeroBaseline = dataMin < 0 && dataMax > 0;
    const baselineValue = shouldShowZeroBaseline ? 0 : dataMin;

    // scales
    const dateScale = useMemo(
      () =>
        scaleTime({
          range: [margin.left, innerWidth + margin.left],
          domain: extent(data, getDate) as [Date, Date],
        }),
      [innerWidth, margin.left, data],
    );
    
    const pnlValueScale = useMemo(
      () => {
        const domainMin = shouldShowZeroBaseline ? Math.min(0, dataMin) : dataMin;
        const domainMax = shouldShowZeroBaseline ? Math.max(0, dataMax) : dataMax;
        
        // Add padding to domain for better visualization
        const padding = dataRange > 0 ? dataRange * 0.1 : Math.abs(domainMax) * 0.1;
        
        return scaleLinear({
          range: [innerHeight + margin.top, margin.top],
          domain: [domainMin - padding, domainMax + padding],
          nice: true,
        });
      },
      [margin.top, innerHeight, data, dataMin, dataMax, dataRange, shouldShowZeroBaseline],
    );

    // tooltip handler
    const handleTooltip = useCallback(
      (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
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
      },
      [showTooltip, pnlValueScale, dateScale, data],
    );

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
          
          {/* Dynamic gradient based on P&L values */}
          <LinearGradient 
            id="area-gradient" 
            from={dataMax >= 0 ? "#10b981" : "#ef4444"} 
            to={dataMax >= 0 ? "#10b981" : "#ef4444"} 
            toOpacity={0.1} 
          />
          {/* Show zero baseline only when data crosses zero */}
          {shouldShowZeroBaseline && (
            <Line
              from={{ x: margin.left, y: pnlValueScale(0) }}
              to={{ x: innerWidth + margin.left, y: pnlValueScale(0) }}
              stroke="#6b7280"
              strokeWidth={1}
              strokeOpacity={0.5}
              strokeDasharray="2,2"
              pointerEvents="none"
            />
          )}
          
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
          
          {/* Render area chart with dynamic styling based on P&L values */}
          <AreaClosed<PnlDataPoint>
            data={data}
            x={(d) => dateScale(getDate(d)) ?? 0}
            y={(d) => pnlValueScale(getPnlValue(d)) ?? 0}
            yScale={pnlValueScale}
            strokeWidth={1}
            stroke={dataMax >= 0 ? "#10b981" : "#ef4444"}
            fill="url(#area-gradient)"
            curve={curveMonotoneX}
          />
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
          {tooltipData && (
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
                fill={getPnlValue(tooltipData) >= 0 ? "#10b981" : "#ef4444"}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
        </svg>
        {tooltipData && (
          <div>
            <TooltipWithBounds
              key={Math.random()}
              top={tooltipTop - 12}
              left={tooltipLeft + 12}
              style={{
                ...tooltipStyles,
                background: getPnlValue(tooltipData) >= 0 ? '#10b981' : '#ef4444',
              }}
            >
              {`$${getPnlValue(tooltipData).toLocaleString()}`}
            </TooltipWithBounds>
            <Tooltip
              top={innerHeight + margin.top - 14}
              left={tooltipLeft}
              style={{
                ...defaultStyles,
                minWidth: 72,
                textAlign: 'center',
                transform: 'translateX(-50%)',
              }}
            >
              {formatDate(getDate(tooltipData))}
            </Tooltip>
          </div>
        )}
      </div>
    );
  },
);

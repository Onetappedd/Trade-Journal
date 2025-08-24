'use client';

import { useMemo, useCallback } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { ParentSize } from '@visx/responsive';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { bisector, extent } from 'd3-array';
import { timeFormat } from 'd3-time-format';

export type PnlPoint = { t: Date; v: number };

export function usd(n: number) { 
  return n.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 2 
  }); 
}

interface PnlAreaChartProps {
  data: PnlPoint[];
  height?: number;
  margin?: {top: number; right: number; bottom: number; left: number};
  showAxes?: boolean;
}

export default function PnlAreaChart({
  data, 
  height=280, 
  margin={top:10, right:16, bottom:28, left:56},
  showAxes=true,
}: PnlAreaChartProps) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No P&L data available</p>
      </div>
    );
  }

  const formatDate = timeFormat('%b %d, %Y');
  const bisect = bisector<PnlPoint, Date>(d => d.t).left;

  return (
    <ParentSize>
      {({ width }) => {
        const innerWidth = Math.max(0, width - margin.left - margin.right);
        const innerHeight = Math.max(0, height - margin.top - margin.bottom);
        const x = (d: PnlPoint) => d.t;
        const y = (d: PnlPoint) => d.v;

        // scales
        const xDomain = extent(data, x) as [Date, Date];
        const yMin = Math.min(0, ...data.map(y));
        const yMax = Math.max(0, ...data.map(y));
        const xScale = scaleTime({ domain: xDomain, range: [0, innerWidth] });
        const yScale = scaleLinear({ domain: [yMin, yMax], range: [innerHeight, 0], nice: true });

        // gradient offset where 0 occurs (0..1)
        const offset = yMax===yMin ? 0.5 : (yScale(0) / innerHeight);
        const gradId = 'pnl-grad';

        const {
          showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop
        } = useTooltip<PnlPoint>();

        const handleMouse = useCallback((e: React.MouseEvent<SVGRectElement>) => {
          const { left } = (e.target as SVGElement).getBoundingClientRect();
          const xPoint = e.clientX - left - margin.left;
          const x0 = xScale.invert(xPoint);
          const i = Math.max(0, Math.min(data.length-1, bisect(data, x0)));
          const d0 = data[i - 1];
          const d1 = data[i];
          const d = !d0 ? d1 : !d1 ? d0 : (x0.getTime() - d0.t.getTime() > d1.t.getTime() - x0.getTime() ? d1 : d0);
          showTooltip({ tooltipData: d, tooltipLeft: xScale(d.t), tooltipTop: yScale(d.v) });
        }, [data, xScale, yScale, showTooltip, margin.left]);

        return (
          <div className="relative">
            <svg width={width} height={height}>
              <LinearGradient 
                id={gradId} 
                from="hsl(142.1 76.2% 36.3%)" 
                to="hsl(0 84.2% 60.2%)" 
                fromOffset={offset} 
                toOffset={offset} 
              />
              <g transform={`translate(${margin.left},${margin.top})`}>
                <AreaClosed
                  data={data}
                  x={d => xScale(x(d)) ?? 0}
                  y={d => yScale(y(d)) ?? 0}
                  yScale={yScale}
                  curve={curveMonotoneX}
                  fill={`url(#${gradId})`}
                  stroke="none"
                />
                <LinePath
                  data={data}
                  x={d => xScale(x(d)) ?? 0}
                  y={d => yScale(y(d)) ?? 0}
                  curve={curveMonotoneX}
                  className="stroke-2"
                  stroke="hsl(var(--foreground))"
                />
                {/* zero baseline */}
                {yMin < 0 && yMax > 0 && (
                  <line 
                    x1={0} 
                    x2={innerWidth} 
                    y1={yScale(0)} 
                    y2={yScale(0)} 
                    className="stroke-muted-foreground/30" 
                    strokeWidth={1}
                  />
                )}
                {showAxes && (
                  <>
                    <AxisLeft 
                      left={0} 
                      scale={yScale} 
                      tickFormat={(n)=>usd(Number(n))} 
                      numTicks={4} 
                      tickStroke="hsl(var(--muted-foreground))" 
                      stroke="hsl(var(--muted-foreground))" 
                      tickLabelProps={() => ({
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                        textAnchor: "end",
                        dy: "0.33em",
                      })}
                    />
                    <AxisBottom 
                      top={innerHeight} 
                      scale={xScale} 
                      numTicks={6} 
                      tickStroke="hsl(var(--muted-foreground))"
                      stroke="hsl(var(--muted-foreground))"
                      tickLabelProps={() => ({
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                        textAnchor: "middle",
                        dy: "0.33em",
                      })}
                    />
                  </>
                )}
                <Bar 
                  x={0} 
                  y={0} 
                  width={innerWidth} 
                  height={innerHeight} 
                  fill="transparent"
                  onMouseMove={handleMouse} 
                  onMouseLeave={hideTooltip} 
                />
              </g>
            </svg>
            {tooltipData && (
              <TooltipWithBounds 
                left={(tooltipLeft ?? 0) + margin.left} 
                top={(tooltipTop ?? 0) + margin.top} 
                className="rounded-xl border bg-background px-3 py-2 shadow-lg z-50"
              >
                <div className="text-xs text-muted-foreground">{formatDate(tooltipData.t)}</div>
                <div className="font-medium tabular-nums">{usd(tooltipData.v)}</div>
              </TooltipWithBounds>
            )}
          </div>
        );
      }}
    </ParentSize>
  );
}

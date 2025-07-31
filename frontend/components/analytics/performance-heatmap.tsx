"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface HeatmapData {
  day: number; // 0 = Monday
  hour: number; // 0 = 00:00 UTC
  value: number;
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hourLabels = [9, 10, 11, 12, 13, 14, 15, 16]; // Market hours

function getColor(value: number, min: number, max: number) {
  // Diverging: red (loss) -> white (neutral) -> green (profit)
  if (value === 0) return "#f3f4f6"; // gray-100
  if (value > 0) {
    const g = Math.min(255, 220 + Math.round((value / max) * 35));
    return `rgb(34,197,94,${0.2 + 0.8 * (value / max)})`; // green-500 with opacity
  }
  // Negative
  return `rgba(239,68,68,${0.2 + 0.8 * (Math.abs(value) / Math.abs(min))})`; // red-500 with opacity
}

export function PerformanceHeatmap({ data, loading }: { data: HeatmapData[]; loading?: boolean }) {
  // Find min/max for color scaling
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));

  return (
    <Card className="p-6 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle>Performance Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px] rounded" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-max border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-16"></th>
                  {hourLabels.map((h) => (
                    <th key={h} className="text-xs font-semibold text-muted-foreground px-2 py-1 text-center">{h}:00</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayLabels.map((day, dayIdx) => (
                  <tr key={day}>
                    <td className="text-xs font-semibold text-muted-foreground pr-2 py-1 text-right">{day}</td>
                    {hourLabels.map((hour) => {
                      const cell = data.find((d) => d.day === dayIdx && d.hour === hour);
                      const color = cell ? getColor(cell.value, min, max) : "#f3f4f6";
                      return (
                        <td
                          key={hour}
                          className="w-12 h-10 text-center align-middle transition-all duration-150 cursor-pointer rounded-md"
                          style={{ background: color, position: "relative" }}
                        >
                          <span className="text-xs font-mono font-medium select-none" style={{ color: cell && cell.value !== 0 ? (cell.value > 0 ? "#166534" : "#991b1b") : "#64748b" }}>
                            {cell ? cell.value : "-"}
                          </span>
                          {/* Tooltip on hover */}
                          {cell && (
                            <div className="absolute left-1/2 top-0 z-10 hidden group-hover:block pointer-events-none" style={{ transform: "translate(-50%, -110%)" }}>
                              <div className="bg-white dark:bg-background border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2 text-xs font-medium">
                                {day}, {hour}:00<br />
                                Value: {cell.value}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

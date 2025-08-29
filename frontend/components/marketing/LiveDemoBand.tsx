'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type InstrumentType = 'equities' | 'options' | 'futures';

interface DataPoint {
  date: string;
  value: number;
}

// Deterministic PRNG for SSR/CSR consistency
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// Generate synthetic data based on instrument type
function generateSyntheticData(type: InstrumentType): DataPoint[] {
  const random = seededRandom(type === 'equities' ? 123 : type === 'options' ? 456 : 789);
  const points: DataPoint[] = [];
  
  const baseDate = new Date('2024-01-01');
  const volatility = type === 'equities' ? 0.02 : type === 'options' ? 0.05 : 0.03;
  const trend = type === 'equities' ? 0.001 : type === 'options' ? -0.002 : 0.0005;
  
  let currentValue = 10000;
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    // Add trend and noise
    const noise = (random() - 0.5) * volatility;
    currentValue *= (1 + trend + noise);
    
    points.push({
      date: date.toISOString().split('T')[0],
      value: currentValue
    });
  }
  
  return points;
}

// Calculate SVG path for area chart
function createAreaPath(data: DataPoint[], width: number, height: number): string {
  if (data.length === 0) return '';
  
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const range = maxValue - minValue;
  const baseline = 10000; // Starting value
  
  const xStep = width / (data.length - 1);
  const yScale = height / (range * 1.2); // Add 20% padding
  
  let path = `M 0 ${height - ((data[0].value - minValue) * yScale)}`;
  
  // Draw the line
  for (let i = 1; i < data.length; i++) {
    const x = i * xStep;
    const y = height - ((data[i].value - minValue) * yScale);
    path += ` L ${x} ${y}`;
  }
  
  // Close the area
  path += ` L ${width} ${height}`;
  path += ` L 0 ${height}`;
  path += ' Z';
  
  return path;
}

// Calculate line path for the chart line
function createLinePath(data: DataPoint[], width: number, height: number): string {
  if (data.length === 0) return '';
  
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  const xStep = width / (data.length - 1);
  const yScale = height / (range * 1.2);
  
  let path = `M 0 ${height - ((data[0].value - minValue) * yScale)}`;
  
  for (let i = 1; i < data.length; i++) {
    const x = i * xStep;
    const y = height - ((data[i].value - minValue) * yScale);
    path += ` L ${x} ${y}`;
  }
  
  return path;
}

export function LiveDemoBand({ id }: { id: string }) {
  const [selectedType, setSelectedType] = useState<InstrumentType>('equities');
  const [isProfit, setIsProfit] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  
  const data = useMemo(() => generateSyntheticData(selectedType), [selectedType]);
  
  const width = 600;
  const height = 200;
  const areaPath = createAreaPath(data, width, height);
  const linePath = createLinePath(data, width, height);
  
  const isPositive = data[data.length - 1]?.value > 10000;
  const finalColor = isProfit ? (isPositive ? '#22c55e' : '#ef4444') : (isPositive ? '#ef4444' : '#22c55e');
  
  const handlePointHover = (point: DataPoint) => {
    setHoveredPoint(point);
  };
  
  const handlePointLeave = () => {
    setHoveredPoint(null);
  };
  
  return (
    <section className="py-16 bg-[--pp-card] border-y border-[--pp-border]">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl font-bold text-[--pp-text] mb-4">
          Live demo (synthetic)
        </h2>
        <p className="text-lg text-[--pp-muted] mb-8">
          Interactive chart showing simulated P&L across different instrument types
        </p>
        
        {/* Instrument Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[--pp-bg] rounded-lg p-1 border border-[--pp-border]">
            {(['equities', 'options', 'futures'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] ${
                  selectedType === type
                    ? 'bg-[--pp-accent] text-white'
                    : 'text-[--pp-muted] hover:text-[--pp-text]'
                }`}
                aria-label={`Show ${type} data`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Profit/Loss Toggle */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsProfit(!isProfit)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[--pp-bg] border border-[--pp-border] text-sm text-[--pp-muted] hover:text-[--pp-text] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
            aria-label="Toggle profit/loss color scheme"
          >
            <span>{isProfit ? '📈' : '📉'}</span>
            {isProfit ? 'Profit' : 'Loss'}
          </button>
        </div>
        
        {/* Chart Container */}
        <div className="relative bg-[--pp-bg] border border-[--pp-border] rounded-lg p-4">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            aria-label={`${selectedType} P&L chart`}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Baseline */}
            <line
              x1="0"
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="1"
              strokeDasharray="4"
            />
            
            {/* Area fill */}
            <path
              d={areaPath}
              fill={finalColor}
              fillOpacity="0.2"
              stroke="none"
            />
            
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={finalColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Interactive points */}
            <TooltipProvider>
              {data.map((point, index) => {
                const minValue = Math.min(...data.map(d => d.value));
                const maxValue = Math.max(...data.map(d => d.value));
                const range = maxValue - minValue;
                const xStep = width / (data.length - 1);
                const yScale = height / (range * 1.2);
                const x = index * xStep;
                const y = height - ((point.value - minValue) * yScale);
                
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill={finalColor}
                        opacity="0"
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                        onMouseEnter={() => handlePointHover(point)}
                        onMouseLeave={handlePointLeave}
                        onTouchStart={() => handlePointHover(point)}
                        onTouchEnd={handlePointLeave}
                        aria-label={`${point.date}: $${point.value.toFixed(2)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        <strong>{point.date}</strong><br />
                        ${point.value.toFixed(2)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </svg>
          
          {/* Current value display */}
          <div className="absolute top-4 right-4 bg-[--pp-card] border border-[--pp-border] rounded-lg px-3 py-2">
            <div className="text-sm text-[--pp-muted]">Current</div>
            <div className={`text-lg font-bold ${isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              ${data[data.length - 1]?.value.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Chart info */}
        <div className="mt-6 text-sm text-[--pp-muted]">
          <p>Hover or tap points to see values • Data is synthetic for demonstration</p>
        </div>
      </div>
    </section>
  );
}

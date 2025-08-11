export function chartTheme() {
  const cs = getComputedStyle(document.documentElement)
  const v = (k: string) => cs.getPropertyValue(k).trim()
  return {
    axis: `hsl(${v('--chart-axis')})`,
    grid: `hsl(${v('--chart-grid')})`,
    fg: `hsl(${v('--foreground')})`,
    bg: `hsl(${v('--card')})`,
    primary: `hsl(${v('--primary')})`,
    pos: `hsl(${v('--success')})`,
    neg: `hsl(${v('--danger')})`,
  }
}

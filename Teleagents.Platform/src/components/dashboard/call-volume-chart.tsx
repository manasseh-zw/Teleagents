import { useState } from "react"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { MoreHorizontalIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { callVolumeData } from "@/data/dashboard"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type ChartType = "line" | "area" | "bar"
type Period = "3m" | "6m" | "12m"

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { month: string; week: number; calls: number } }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0]
    const prevIndex = callVolumeData.findIndex((d) => d.week === data.payload.week) - 1
    const prevValue = prevIndex >= 0 ? callVolumeData[prevIndex].calls : data.value
    const change = prevValue > 0 ? (((data.value - prevValue) / prevValue) * 100).toFixed(1) : 0

    return (
      <div className="bg-card border rounded-lg px-3 py-2 shadow-sm">
        <p className="text-xs text-muted-foreground">Week {data.payload.week}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-semibold text-sm tabular-nums">{data.value} calls</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
            {Number(change) >= 0 ? "+" : ""}{change}%
          </span>
        </div>
      </div>
    )
  }
  return null
}

export function CallVolumeChart() {
  const [chartType, setChartType] = useState<ChartType>("area")
  const [period, setPeriod] = useState<Period>("12m")
  const [showGrid, setShowGrid] = useState(true)
  const [smoothCurve, setSmoothCurve] = useState(true)

  const getDataForPeriod = () => {
    switch (period) {
      case "3m": return callVolumeData.slice(-12)
      case "6m": return callVolumeData.slice(-24)
      default: return callVolumeData
    }
  }

  const data = getDataForPeriod()
  const lineColor = "#6e3ff3"
  const gridColor = "var(--border)"
  const axisColor = "var(--muted-foreground)"

  const sharedAxisProps = {
    axisLine: false as const,
    tickLine: false as const,
    tick: { fontSize: 11, fill: axisColor },
  }

  const renderChart = () => {
    const commonProps = { data, margin: { top: 16, right: 8, left: -20, bottom: 0 } }
    const gridEl = showGrid
      ? <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
      : null
    const xAxis = <XAxis dataKey="month" {...sharedAxisProps} interval="preserveStartEnd" />
    const yAxis = <YAxis {...sharedAxisProps} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]} />
    const tooltip = (
      <Tooltip
        content={<CustomTooltip />}
        cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: "4 4" }}
      />
    )

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          {gridEl}{xAxis}{yAxis}{tooltip}
          <defs>
            <linearGradient id="callBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6e3ff3" />
              <stop offset="100%" stopColor="#aa8ef9" />
            </linearGradient>
          </defs>
          <Bar dataKey="calls" fill="url(#callBarGradient)" radius={[3, 3, 0, 0]} />
        </BarChart>
      )
    }

    if (chartType === "area") {
      return (
        <AreaChart {...commonProps}>
          {gridEl}{xAxis}{yAxis}{tooltip}
          <defs>
            <linearGradient id="callAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6e3ff3" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#6e3ff3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type={smoothCurve ? "monotone" : "linear"}
            dataKey="calls"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#callAreaGradient)"
            dot={false}
            activeDot={{ r: 5, fill: lineColor, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      )
    }

    return (
      <LineChart {...commonProps}>
        {gridEl}{xAxis}{yAxis}{tooltip}
        <Line
          type={smoothCurve ? "monotone" : "linear"}
          dataKey="calls"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: lineColor, stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    )
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl border h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-medium text-sm">Call volume</h3>
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
            <MoreHorizontalIcon className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Chart type</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setChartType("line")}>
                  Line {chartType === "line" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("area")}>
                  Area {chartType === "area" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("bar")}>
                  Bar {chartType === "bar" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Time period</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setPeriod("3m")}>
                  Last 3 months {period === "3m" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriod("6m")}>
                  Last 6 months {period === "6m" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriod("12m")}>
                  Last 12 months {period === "12m" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
              Show grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={smoothCurve}
              onCheckedChange={setSmoothCurve}
              disabled={chartType === "bar"}
            >
              Smooth curve
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setChartType("area")
                setPeriod("12m")
                setShowGrid(true)
                setSmoothCurve(true)
              }}
            >
              Reset to default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-5 pt-4 pb-5">
        <div className="h-[200px] sm:h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-end">
          <a
            href="/call-history"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View calls →
          </a>
        </div>
      </div>
    </div>
  )
}

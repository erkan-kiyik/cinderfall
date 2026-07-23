"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Chart colors follow the validated categorical palette (fixed slot order:
 * blue, aqua, yellow, green). Light-mode aqua/yellow sit below 3:1 contrast,
 * so charts always ship a legend + tooltips; dark-mode CVD separation is in
 * the floor band, mitigated with 2px surface gaps between stacked segments.
 */
const PALETTE = {
  light: {
    series: ["#2a78d6", "#1baf7a", "#eda100", "#008300"],
    grid: "#e1e0d9",
    axis: "#898781",
    tooltipBg: "#ffffff",
    tooltipText: "#0b0b0b",
    surface: "#ffffff",
  },
  dark: {
    series: ["#3987e5", "#199e70", "#c98500", "#008300"],
    grid: "#2c2c2a",
    axis: "#898781",
    tooltipBg: "#191c26",
    tooltipText: "#ffffff",
    surface: "#11141c",
  },
};

function usePalette() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return { palette: PALETTE[mounted && resolvedTheme === "dark" ? "dark" : "light"], mounted };
}

interface TooltipStyleProps {
  bg: string;
  text: string;
}

function tooltipStyle({ bg, text }: TooltipStyleProps): React.CSSProperties {
  return {
    backgroundColor: bg,
    color: text,
    border: "1px solid rgba(137,135,129,0.25)",
    borderRadius: 12,
    fontSize: 12,
    padding: "8px 12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  };
}

// ─── Score trend (single series → no legend, direct title names it) ──

export interface ScorePoint {
  date: string;
  score: number;
}

export function ScoreTrendChart({ data }: { data: ScorePoint[] }) {
  const { palette, mounted } = usePalette();
  if (!mounted) return <div className="h-64" />;

  const blue = palette.series[0];

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={blue} stopOpacity={0.25} />
            <stop offset="100%" stopColor={blue} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: palette.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: palette.grid }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: palette.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle({ bg: palette.tooltipBg, text: palette.tooltipText })}
          cursor={{ stroke: palette.axis, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="score"
          name="Profile score"
          stroke={blue}
          strokeWidth={2}
          fill="url(#scoreFill)"
          dot={{ r: 3, fill: blue, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Activity (stacked, 4 fixed series in palette order) ────────────

export interface ActivityPoint {
  date: string;
  analyses: number;
  generations: number;
  posts: number;
  coach: number;
}

const ACTIVITY_SERIES = [
  { key: "analyses", label: "Analyses" },
  { key: "generations", label: "Generations" },
  { key: "posts", label: "Posts" },
  { key: "coach", label: "Coach" },
] as const;

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const { palette, mounted } = usePalette();
  if (!mounted) return <div className="h-64" />;

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: palette.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: palette.grid }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: palette.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle({ bg: palette.tooltipBg, text: palette.tooltipText })}
          cursor={{ fill: "rgba(137,135,129,0.08)" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: palette.axis }}
        />
        {ACTIVITY_SERIES.map((series, i) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            name={series.label}
            stackId="activity"
            fill={palette.series[i]}
            // 2px surface gap between stacked segments (CVD relief)
            stroke={palette.surface}
            strokeWidth={2}
            radius={i === ACTIVITY_SERIES.length - 1 ? [4, 4, 0, 0] : 0}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Skill demand (horizontal-ish bar for skills analyzer) ──────────

export interface SkillBarPoint {
  name: string;
  value: number;
}

export function SkillBarChart({ data, label }: { data: SkillBarPoint[]; label: string }) {
  const { palette, mounted } = usePalette();
  if (!mounted) return <div className="h-64" />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 42)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: palette.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: palette.grid }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fill: palette.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle({ bg: palette.tooltipBg, text: palette.tooltipText })}
          cursor={{ fill: "rgba(137,135,129,0.08)" }}
        />
        <Bar
          dataKey="value"
          name={label}
          fill={palette.series[0]}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          label={{ position: "right", fill: palette.axis, fontSize: 11 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

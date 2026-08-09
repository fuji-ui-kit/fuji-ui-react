"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  data: ChartPoint[];
  color?: string;
}

export interface ChartBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  legend?: boolean;
  formatValue?: (value: number) => string;
  empty?: boolean;
  loading?: boolean;
}

const SERIES_COLORS = [
  "var(--fuji-default)",
  "var(--fuji-forest)",
  "var(--fuji-water)",
  "var(--fuji-sun)",
  "var(--fuji-fire)",
];

const DEFAULT_FORMAT = (value: number) => value.toLocaleString();
const VIEWBOX_WIDTH = 640;
const VIEWBOX_HEIGHT = 280;
const PLOT = { left: 52, right: 16, top: 18, bottom: 42 };
const PLOT_WIDTH = VIEWBOX_WIDTH - PLOT.left - PLOT.right;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - PLOT.top - PLOT.bottom;

function useChartEntrance() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return ready;
}

function ChartTooltip({
  x,
  y,
  label,
  name,
  value,
  color,
  formatValue,
}: {
  x: number;
  y: number;
  label: string;
  name: string;
  value: number;
  color: string;
  formatValue: (value: number) => string;
}) {
  const width = 126;
  const height = 42;
  const tooltipX = Math.max(2, Math.min(x - width / 2, VIEWBOX_WIDTH - width - 2));
  const tooltipY = Math.max(2, y - height - 10);

  return (
    <g pointerEvents="none">
      <rect
        x={tooltipX}
        y={tooltipY}
        width={width}
        height={height}
        rx="7"
        fill="var(--fuji-surface-overlay)"
        stroke="var(--fuji-border-strong)"
      />
      <circle cx={tooltipX + 10} cy={tooltipY + 13} r="3" fill={color} />
      <text x={tooltipX + 18} y={tooltipY + 16} fill="var(--fuji-foreground)" fontSize="11">
        {label}
      </text>
      <text x={tooltipX + 10} y={tooltipY + 32} fill="var(--fuji-foreground-muted)" fontSize="10">
        {name}: {formatValue(value)}
      </text>
    </g>
  );
}

function ChartFrame({
  title,
  description,
  legend,
  series,
  empty,
  loading,
  children,
  className,
  formatValue = DEFAULT_FORMAT,
  ...props
}: ChartBaseProps & { series: ChartSeries[]; children: React.ReactNode }) {
  const ready = useChartEntrance();

  return (
    <div
      className={cn(
        "fuji-glass-surface fj:min-w-0 fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-4 fj:shadow-fuji-card",
        className,
      )}
      {...props}
    >
      {(title || description) && (
        <div className="fj:mb-3 fj:min-w-0">
          {title && (
            <p className="fj:m-0 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground">
              {title}
            </p>
          )}
          {description && (
            <p className="fj:mt-1 fj:mb-0 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-muted">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={cn("fuji-chart-entrance", ready && "fuji-chart-entrance-ready")}>
        {loading ? (
          <div className="fj:flex fj:h-48 fj:items-end fj:gap-2" aria-label="Loading chart" role="status">
            {[35, 55, 42, 72, 50, 64, 46].map((height, index) => (
              <span
                key={index}
                className="fj:animate-pulse fj:flex-1 fj:rounded-t-[4px] fj:bg-fuji-surface-strong"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        ) : empty || series.every((item) => item.data.length === 0) ? (
          <div className="fj:flex fj:h-48 fj:items-center fj:justify-center fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">
            No chart data available.
          </div>
        ) : (
          children
        )}
      </div>
      {legend && !loading && !empty && (
        <div className="fj:mt-3 fj:flex fj:flex-wrap fj:gap-x-4 fj:gap-y-1.5" aria-label="Chart legend">
          {series.map((item, index) => (
            <span
              key={item.name}
              className="fj:flex fj:items-center fj:gap-1.5 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-muted"
            >
              <span
                className="fj:size-2 fj:rounded-full"
                style={{ backgroundColor: item.color ?? SERIES_COLORS[index % SERIES_COLORS.length] }}
              />
              {item.name}
            </span>
          ))}
        </div>
      )}
      <div className="fj:sr-only">
        <table>
          <caption>{title ?? "Chart data"}</caption>
          <tbody>
            {series.flatMap((item) =>
              item.data.map((point) => (
                <tr key={`${item.name}-${point.label}`}>
                  <th scope="row">
                    {item.name}, {point.label}
                  </th>
                  <td>{formatValue(point.value)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function chartGeometry(series: ChartSeries[]) {
  const points = Math.max(...series.map((item) => item.data.length), 0);
  const values = series.flatMap((item) => item.data.map((point) => point.value));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  return { points, max, min, range: Math.max(max - min, 1) };
}

function yTicks(max: number, min: number, range: number) {
  return [0, 1, 2, 3, 4].map((index) => {
    const value = max - (range * index) / 4;
    return { value, ratio: index / 4 };
  });
}

function Axis({
  labels,
  max,
  min,
  range,
  formatValue,
}: {
  labels: string[];
  max: number;
  min: number;
  range: number;
  formatValue: (value: number) => string;
}) {
  return (
    <>
      {yTicks(max, min, range).map((tick) => (
        <g key={tick.ratio}>
          <line
            x1={PLOT.left}
            x2={VIEWBOX_WIDTH - PLOT.right}
            y1={PLOT.top + PLOT_HEIGHT * tick.ratio}
            y2={PLOT.top + PLOT_HEIGHT * tick.ratio}
            stroke="var(--fuji-border)"
            strokeDasharray="3 5"
          />
          <text
            x={PLOT.left - 8}
            y={PLOT.top + PLOT_HEIGHT * tick.ratio + 4}
            textAnchor="end"
            fill="var(--fuji-foreground-muted)"
            fontSize="10"
          >
            {formatValue(tick.value)}
          </text>
        </g>
      ))}
      {labels.map((label, index) => {
        const x =
          labels.length <= 1
            ? PLOT.left + PLOT_WIDTH / 2
            : PLOT.left + (index / (labels.length - 1)) * PLOT_WIDTH;
        return (
          <text
            key={`${label}-${index}`}
            x={x}
            y={VIEWBOX_HEIGHT - 12}
            textAnchor="middle"
            fill="var(--fuji-foreground-muted)"
            fontSize="10"
          >
            {label}
          </text>
        );
      })}
    </>
  );
}

export interface LineChartProps extends ChartBaseProps {
  series: ChartSeries[];
  showPoints?: boolean;
}

export function LineChart({
  series,
  showPoints = true,
  formatValue = DEFAULT_FORMAT,
  ...props
}: LineChartProps) {
  const { points, max, min, range } = chartGeometry(series);
  // Named `pointKey`, not `key` - the hovered object is spread onto
  // `<ChartTooltip>` below, and a "key" field in a spread props object
  // triggers React's reserved-prop-name warning.
  const [hovered, setHovered] = React.useState<{
    pointKey: string;
    x: number;
    y: number;
    label: string;
    name: string;
    value: number;
    color: string;
  } | null>(null);
  const clear = (key: string) => setHovered((current) => (current?.pointKey === key ? null : current));
  const labels = series.find((item) => item.data.length > 0)?.data.map((point) => point.label) ?? [];
  const x = (index: number) =>
    points <= 1 ? PLOT.left + PLOT_WIDTH / 2 : PLOT.left + (index / (points - 1)) * PLOT_WIDTH;
  const y = (value: number) => PLOT.top + PLOT_HEIGHT - ((value - min) / range) * PLOT_HEIGHT;

  return (
    <ChartFrame series={series} formatValue={formatValue} {...props}>
      <div className="fj:min-w-0 fj:overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="fj:h-auto fj:min-h-52 fj:w-full fj:min-w-[380px]"
          role="img"
          aria-label={props.title ?? "Line chart"}
          onMouseLeave={() => setHovered(null)}
        >
          <Axis labels={labels} max={max} min={min} range={range} formatValue={formatValue} />
          {series.map((item, seriesIndex) => {
            const color = item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
            const path = item.data
              .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`)
              .join(" ");
            return (
              <g key={item.name}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {showPoints &&
                  item.data.map((point, index) => {
                    const key = `${item.name}-${point.label}`;
                    return (
                      <circle
                        key={key}
                        cx={x(index)}
                        cy={y(point.value)}
                        r="5"
                        fill="var(--fuji-surface)"
                        stroke={color}
                        strokeWidth="2"
                        tabIndex={0}
                        role="img"
                        aria-label={`${item.name}, ${point.label}: ${formatValue(point.value)}`}
                        onMouseEnter={() =>
                          setHovered({
                            pointKey: key,
                            x: x(index),
                            y: y(point.value),
                            label: point.label,
                            name: item.name,
                            value: point.value,
                            color,
                          })
                        }
                        onMouseLeave={() => clear(key)}
                        onFocus={() =>
                          setHovered({
                            pointKey: key,
                            x: x(index),
                            y: y(point.value),
                            label: point.label,
                            name: item.name,
                            value: point.value,
                            color,
                          })
                        }
                        onBlur={() => clear(key)}
                      />
                    );
                  })}
              </g>
            );
          })}
          {hovered && <ChartTooltip {...hovered} formatValue={formatValue} />}
        </svg>
      </div>
    </ChartFrame>
  );
}

export interface BarChartProps extends ChartBaseProps {
  series: ChartSeries[];
}

export function BarChart({ series, formatValue = DEFAULT_FORMAT, ...props }: BarChartProps) {
  const { points, max, min, range } = chartGeometry(series);
  // Named `pointKey`, not `key` - the hovered object is spread onto
  // `<ChartTooltip>` below, and a "key" field in a spread props object
  // triggers React's reserved-prop-name warning.
  const [hovered, setHovered] = React.useState<{
    pointKey: string;
    x: number;
    y: number;
    label: string;
    name: string;
    value: number;
    color: string;
  } | null>(null);
  const clear = (key: string) => setHovered((current) => (current?.pointKey === key ? null : current));
  const labels = series.find((item) => item.data.length > 0)?.data.map((point) => point.label) ?? [];
  const groupWidth = PLOT_WIDTH / Math.max(points, 1);
  const totalBarWidth = Math.min(groupWidth * 0.7, 72);
  const barWidth = Math.max(totalBarWidth / Math.max(series.length, 1) - 5, 6);
  const baseY = PLOT.top + PLOT_HEIGHT - ((0 - min) / range) * PLOT_HEIGHT;
  const xFor = (index: number) => PLOT.left + index * groupWidth + groupWidth / 2;
  const y = (value: number) => PLOT.top + PLOT_HEIGHT - ((value - min) / range) * PLOT_HEIGHT;

  return (
    <ChartFrame series={series} formatValue={formatValue} {...props}>
      <div className="fj:min-w-0 fj:overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="fj:h-auto fj:min-h-52 fj:w-full fj:min-w-[380px]"
          role="img"
          aria-label={props.title ?? "Bar chart"}
          onMouseLeave={() => setHovered(null)}
        >
          <Axis labels={labels} max={max} min={min} range={range} formatValue={formatValue} />
          {series.map((item, seriesIndex) => {
            const color = item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
            return item.data.map((point, index) => {
              const height = Math.max(Math.abs(y(point.value) - baseY), 2);
              const barX = xFor(index) - totalBarWidth / 2 + seriesIndex * (barWidth + 5) + 2;
              const barY = point.value >= 0 ? y(point.value) : baseY;
              const key = `${item.name}-${point.label}`;
              return (
                <rect
                  key={key}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={height}
                  rx="4"
                  fill={color}
                  tabIndex={0}
                  role="img"
                  aria-label={`${item.name}, ${point.label}: ${formatValue(point.value)}`}
                  onMouseEnter={() =>
                    setHovered({
                      pointKey: key,
                      x: barX + barWidth / 2,
                      y: barY,
                      label: point.label,
                      name: item.name,
                      value: point.value,
                      color,
                    })
                  }
                  onMouseLeave={() => clear(key)}
                  onFocus={() =>
                    setHovered({
                      pointKey: key,
                      x: barX + barWidth / 2,
                      y: barY,
                      label: point.label,
                      name: item.name,
                      value: point.value,
                      color,
                    })
                  }
                  onBlur={() => clear(key)}
                />
              );
            });
          })}
          {hovered && <ChartTooltip {...hovered} formatValue={formatValue} />}
        </svg>
      </div>
    </ChartFrame>
  );
}

export interface DonutChartProps extends ChartBaseProps {
  data: ChartPoint[];
  centerLabel?: string;
}

export function DonutChart({ data, centerLabel, formatValue = DEFAULT_FORMAT, ...props }: DonutChartProps) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const series = [{ name: "Values", data }];
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <ChartFrame series={series} formatValue={formatValue} legend {...props}>
      <div className="fj:flex fj:min-w-0 fj:flex-wrap fj:items-center fj:justify-center fj:gap-6">
        <div className="fj:relative fj:size-40 fj:shrink-0">
          <svg
            viewBox="0 0 160 160"
            className="fj:size-full fj:-rotate-90"
            role="img"
            aria-label={props.title ?? "Donut chart"}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--fuji-border)" strokeWidth="22" />
            {data.map((point, index) => {
              const length = total ? (point.value / total) * circumference : 0;
              const offset = data
                .slice(0, index)
                .reduce((sum, previous) => sum + (total ? (previous.value / total) * circumference : 0), 0);
              const color = SERIES_COLORS[index % SERIES_COLORS.length];
              return (
                <circle
                  key={point.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="22"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  tabIndex={0}
                  role="img"
                  aria-label={`${point.label}: ${formatValue(point.value)}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex((current) => (current === index ? null : current))}
                />
              );
            })}
            {hoveredIndex !== null && (
              <g transform="rotate(90 80 80)">
                <ChartTooltip
                  x={80}
                  y={20}
                  label={data[hoveredIndex].label}
                  name="Value"
                  value={data[hoveredIndex].value}
                  color={SERIES_COLORS[hoveredIndex % SERIES_COLORS.length]}
                  formatValue={formatValue}
                />
              </g>
            )}
          </svg>
          <span className="fj:absolute fj:inset-0 fj:flex fj:flex-col fj:items-center fj:justify-center fj:text-center">
            <strong className="fj:text-[length:var(--fuji-text-lg)] fj:text-fuji-foreground">
              {centerLabel ?? formatValue(total)}
            </strong>
            <span className="fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-muted">Total</span>
          </span>
        </div>
        <div className="fj:flex fj:flex-col fj:gap-2">
          {data.map((point, index) => (
            <span
              key={point.label}
              className="fj:flex fj:items-center fj:gap-2 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted"
            >
              <span
                className="fj:size-2 fj:rounded-full"
                style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
              />
              <span>{point.label}</span>
              <span className="fj:ml-auto fj:pl-4 fj:text-fuji-foreground">{formatValue(point.value)}</span>
            </span>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

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

export interface ChartHeadline {
  /** Small caption above the figure ("Total $ profit"). */
  label?: string;
  /** The figure itself, already formatted ("$420,110"). */
  value: string;
  /** A change to show beside it as a pill ("12%"). */
  delta?: string;
  /** Colours the pill: green for `"up"`, red for `"down"`. Default `"up"`. */
  deltaTrend?: "up" | "down";
  /** Text after the pill ("vs last year"). */
  note?: string;
}

export interface ChartStat {
  label: string;
  value: string;
}

export interface ChartBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Heading above the plot. Also becomes the plot's accessible name and its data table's caption. */
  title?: string;
  /** A line under the title saying what the figures are. */
  description?: string;
  /** A small glyph before the title. */
  icon?: React.ReactNode;
  /** Controls on the trailing edge of the header - typically ghost `IconButton`s. */
  actions?: React.ReactNode;
  /** The dashboard-card figure under the title: a big number with a change pill. */
  headline?: ChartHeadline;
  /** A row of label/value pairs under the title ("Visit duration · 1m 35s"). */
  stats?: ChartStat[];
  /** Lists the series names with their colour swatches under the plot. */
  legend?: boolean;
  /**
   * Formats every printed figure - axis ticks, tooltips, the data table.
   * Defaults to `toLocaleString()`. Use it for currency, units or precision.
   */
  formatValue?: (value: number) => string;
  /** Forces the "no data" message even when `series` has content. */
  empty?: boolean;
  /** Shows pulsing placeholder bars instead of the plot, for an async load. */
  loading?: boolean;
}

// The first series is "ink" - the theme's foreground - so it is black on
// light, cream on dark and white on glass. `--fuji-default` (the raised
// accent fill) is near-black under glass and vanished on the dark card.
const SERIES_COLORS = [
  "var(--fuji-foreground)",
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
  icon,
  actions,
  headline,
  stats,
  legend,
  series,
  empty,
  loading,
  children,
  className,
  formatValue = DEFAULT_FORMAT,
  ...props
}: ChartBaseProps & { series: ChartSeries[]; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "fuji-glass-surface fj:box-border fj:min-w-0 fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-4 fj:shadow-fuji-card",
        className,
      )}
      {...props}
    >
      {(title || description || actions) && (
        <div className="fj:mb-3 fj:flex fj:min-w-0 fj:items-start fj:justify-between fj:gap-3">
          <div className="fj:min-w-0">
            {title && (
              <p className="fj:m-0 fj:flex fj:items-center fj:gap-1.5 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground fj:[&>svg]:size-4 fj:[&>svg]:text-fuji-foreground-muted">
                {icon}
                {title}
              </p>
            )}
            {description && (
              <p className="fj:mt-1 fj:mb-0 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-muted">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="fj:flex fj:shrink-0 fj:items-center fj:gap-0.5">{actions}</div>}
        </div>
      )}
      {headline && (
        <div className="fj:mb-3 fj:min-w-0">
          {headline.label && (
            <p className="fj:m-0 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-muted">
              {headline.label}
            </p>
          )}
          <p className="fj:m-0 fj:flex fj:flex-wrap fj:items-baseline fj:gap-x-2 fj:gap-y-1">
            <span className="fj:text-[length:var(--fuji-text-xl)] fj:leading-none fj:font-semibold fj:tracking-tight fj:text-fuji-foreground fj:tabular-nums">
              {headline.value}
            </span>
            {headline.delta && (
              <span
                className={cn(
                  "fj:inline-flex fj:items-center fj:gap-0.5 fj:rounded-full fj:px-1.5 fj:py-0.5 fj:text-[length:var(--fuji-text-xs)] fj:font-medium",
                  headline.deltaTrend === "down"
                    ? "fj:bg-fuji-fire-soft fj:text-fuji-fire"
                    : "fj:bg-fuji-forest-soft fj:text-fuji-forest",
                )}
              >
                <span aria-hidden="true">{headline.deltaTrend === "down" ? "↓" : "↑"}</span>
                <span className="fj:sr-only">{headline.deltaTrend === "down" ? "Down" : "Up"}</span>
                {headline.delta}
              </span>
            )}
            {headline.note && (
              <span className="fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle">
                {headline.note}
              </span>
            )}
          </p>
        </div>
      )}
      {stats && stats.length > 0 && (
        <dl className="fj:m-0 fj:mb-3 fj:flex fj:flex-wrap fj:gap-x-6 fj:gap-y-2">
          {stats.map((stat) => (
            <div key={stat.label} className="fj:min-w-0">
              <dt className="fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-muted">
                {stat.label}
              </dt>
              <dd className="fj:m-0 fj:text-[length:var(--fuji-text-md)] fj:font-semibold fj:text-fuji-foreground fj:tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="fuji-chart-entrance">
        {loading ? (
          <div className="fj:flex fj:h-48 fj:items-end fj:gap-2" aria-label="Loading chart" role="status">
            {[35, 55, 42, 72, 50, 64, 46].map((height, index) => (
              <span
                key={index}
                className="fj:animate-fuji-pulse fj:flex-1 fj:rounded-t-[4px] fj:bg-fuji-surface-strong"
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

/**
 * Which point the tooltip is pinned to, rather than a snapshot of where that
 * point was. The rendered `HoveredPoint` is derived from it every render, so
 * the crosshair and tooltip travel with their point while a data change
 * animates instead of hanging at the old coordinates.
 */
type PlotCursor = { series: number; point: number } | null;

type HoveredPoint = {
  pointKey: string;
  x: number;
  y: number;
  label: string;
  name: string;
  value: number;
  color: string;
};

/**
 * Keyboard inspection for a chart plot.
 *
 * Every point and bar used to be its own tab stop: a three-series,
 * twelve-point line chart put thirty-six stops between the control before it
 * and the control after it, and each one announced a value already present in
 * the `sr-only` data table `ChartFrame` renders. The plot is now a single stop
 * (the WAI-ARIA graphics pattern), with arrow keys moving a cursor - left and
 * right along a series, up and down between series - and Escape releasing it.
 *
 * The accessible data has not moved: it is, and was, that `sr-only` table.
 * This is for a sighted keyboard user who wants the tooltip.
 */
function usePlotKeyboard(series: ChartSeries[], setCursor: (cursor: PlotCursor) => void) {
  const cursor = React.useRef({ series: 0, point: 0 });

  return React.useCallback(
    (event: React.KeyboardEvent<SVGSVGElement>) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      if (event.key === "Escape") {
        setCursor(null);
        return;
      }

      const seriesCount = series.length;
      const pointCount = series[cursor.current.series]?.data.length ?? 0;
      if (!seriesCount || !pointCount) return;

      if (event.key === "ArrowLeft") {
        cursor.current.point = Math.max(0, cursor.current.point - 1);
      } else if (event.key === "ArrowRight") {
        cursor.current.point = Math.min(pointCount - 1, cursor.current.point + 1);
      } else if (event.key === "ArrowUp") {
        cursor.current.series = Math.max(0, cursor.current.series - 1);
      } else {
        cursor.current.series = Math.min(seriesCount - 1, cursor.current.series + 1);
      }

      // Switching series can land past the end of a shorter one.
      const nextLength = series[cursor.current.series]?.data.length ?? 0;
      cursor.current.point = Math.min(cursor.current.point, Math.max(0, nextLength - 1));
      setCursor({ ...cursor.current });
    },
    [series, setCursor],
  );
}

/** Shared by both plots: one tab stop, visible focus, no native outline drift. */
const PLOT_SVG_CLASS =
  "fj:h-auto fj:min-h-52 fj:w-full fj:min-w-[380px] fj:rounded-fuji-panel fj:outline-none fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring";

/**
 * How long a data change takes to travel to its new shape.
 */
const UPDATE_MS = 520;

/** Values move; the shape - series names and point labels - does not. */
function sameShape(a: ChartSeries[], b: ChartSeries[]) {
  return (
    a.length === b.length &&
    a.every(
      (item, index) =>
        item.name === b[index].name &&
        item.data.length === b[index].data.length &&
        item.data.every((point, pointIndex) => point.label === b[index].data[pointIndex].label),
    )
  );
}

function sameValues(a: ChartSeries[], b: ChartSeries[]) {
  return (
    sameShape(a, b) &&
    a.every((item, index) =>
      item.data.every((point, pointIndex) => point.value === b[index].data[pointIndex].value),
    )
  );
}

/**
 * An in-flight value is fractional, and the interpolated figure is not only
 * plotted - it is also what the tooltip, the donut legend and the donut total
 * print. "34.28371" flashing there reads as a bug, so a travelling value is
 * rounded to the precision its own magnitude implies (the same idea the axis
 * ticks use). The quantum stays far finer than a pixel at every scale, so this
 * costs the motion nothing.
 */
function stepFor(a: number, b: number) {
  const magnitude = Math.max(Math.abs(a), Math.abs(b));
  return magnitude >= 20 ? 1 : magnitude >= 2 ? 0.1 : 0.01;
}

function interpolateSeries(from: ChartSeries[], to: ChartSeries[], t: number): ChartSeries[] {
  // The last frame is the data itself, never a rounded approximation of it.
  if (t >= 1) return to;
  return to.map((item, index) => ({
    ...item,
    data: item.data.map((point, pointIndex) => {
      const start = from[index].data[pointIndex].value;
      const step = stepFor(start, point.value);
      const value = start + (point.value - start) * t;
      return { ...point, value: Math.round(value / step) * step };
    }),
  }));
}

/**
 * Animates a plot between data sets: the line bends to its new shape, the bars
 * grow or shrink, and the axis rescales with them.
 *
 * Every coordinate the plots draw is derived from `series`, so the entire
 * update animates by handing them an interpolated copy each frame - no element
 * needs an animation of its own. CSS cannot do this job here: a path's `d` is
 * only animatable as a CSS property (`d: path(...)`), never as the attribute
 * React writes, and a bar's `y`/`height` are attributes too. The mount-time
 * entrance keyframes do not cover it either - they never re-run on an element
 * that stays mounted - so before this, re-rolling a chart's data snapped.
 *
 * The raw prop, not this, is what `ChartFrame` puts in its `sr-only` table:
 * assistive technology should read the values, not the frames in between.
 */
function useAnimatedSeries(series: ChartSeries[]): ChartSeries[] {
  const [shown, setShown] = React.useState(series);
  // What is on screen, readable from inside the frame loop without making the
  // effect depend on it (which would restart the tween on every frame).
  const shownRef = React.useRef(series);

  React.useEffect(() => {
    const from = shownRef.current;
    // Consumers routinely pass an inline array, so a new identity is not a new
    // data set. Compare values, not references.
    if (sameValues(from, series)) return;

    const reduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // A change of shape is a different chart, not this one moving: there are
    // no pairs of points to interpolate between, so it snaps and the entrance
    // keyframes on the new elements take over.
    if (reduced || !sameShape(from, series)) {
      shownRef.current = series;
      setShown(series);
      return;
    }

    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / UPDATE_MS);
      // Decelerating, so the shape arrives rather than stopping dead.
      const next = interpolateSeries(from, series, 1 - Math.pow(1 - t, 3));
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [series]);

  return shown;
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
    // Rounded to the precision of the data's own magnitude: a quarter of
    // 5.4 is 4.050000000000001 in floating point, and a consumer's
    // `formatValue` should never have to defend against that.
    const raw = max - (range * index) / 4;
    const decimals = range >= 100 ? 0 : range >= 10 ? 1 : 2;
    const value = Number(raw.toFixed(decimals));
    return { value, ratio: index / 4 };
  });
}

function Axis({
  labels,
  max,
  min,
  range,
  formatValue,
  highlighted,
}: {
  labels: string[];
  max: number;
  min: number;
  range: number;
  formatValue: (value: number) => string;
  /** Labels drawn in a pill (the bar chart's emphasised periods). */
  highlighted?: Set<string>;
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
        // End labels anchor inward so neither is clipped at the plot edge.
        const anchor =
          labels.length > 1 && index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle";
        const isHighlighted = highlighted?.has(label) ?? false;
        const pillWidth = label.length * 6.2 + 14;
        const pillX = anchor === "start" ? x - 4 : anchor === "end" ? x - pillWidth + 4 : x - pillWidth / 2;
        return (
          <g key={`${label}-${index}`}>
            {isHighlighted && (
              <rect
                x={pillX}
                y={VIEWBOX_HEIGHT - 24}
                width={pillWidth}
                height={17}
                rx="8.5"
                fill="var(--fuji-surface-strong)"
              />
            )}
            <text
              x={x}
              y={VIEWBOX_HEIGHT - 12}
              textAnchor={anchor}
              fill={isHighlighted ? "var(--fuji-foreground)" : "var(--fuji-foreground-muted)"}
              fontSize="10"
              fontWeight={isHighlighted ? 600 : undefined}
            >
              {label}
            </text>
          </g>
        );
      })}
    </>
  );
}

export interface LineChartProps extends ChartBaseProps {
  /** One entry per line. Changing the values animates the plot to its new shape. */
  series: ChartSeries[];
  /** Draws a marker at every data point. */
  showPoints?: boolean;
  /**
   * Fills the space under each line with a soft fade of its own color. Off by
   * default - stacked translucent fills read as mud once there is more than
   * one series, so this is a deliberate choice for the one- or two-series
   * case rather than something every chart gets.
   */
  area?: boolean;
  /**
   * `"smooth"` (default) draws a monotone cubic curve through the points - the
   * bold, flowing stroke of the reference dashboards. `"linear"` joins them
   * with straight segments, which is the honest choice when intermediate
   * values must not be implied (step data, sparse samples).
   */
  curve?: "smooth" | "linear";
  /** Stroke width in viewBox units. Default 3.5. */
  strokeWidth?: number;
}

/**
 * Monotone cubic interpolation (Fritsch-Carlson). Unlike a Catmull-Rom or a
 * naive bezier it never overshoots: a curve through [1, 5, 5, 1] stays flat
 * between the two 5s rather than bulging above them, so a smoothed chart
 * never draws a value the data does not contain.
 */
function monotonePath(pts: Array<[number, number]>): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  const dx: number[] = [],
    dy: number[] = [],
    m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    dy.push(pts[i + 1][1] - pts[i][1]);
    m.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i],
      b = t[i + 1] / m[i],
      h = Math.hypot(a, b);
    if (h > 3) {
      t[i] = ((3 * a) / h) * m[i];
      t[i + 1] = ((3 * b) / h) * m[i];
    }
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i],
      [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    d += ` C ${x0 + h} ${y0 + t[i] * h} ${x1 - h} ${y1 - t[i + 1] * h} ${x1} ${y1}`;
  }
  return d;
}

export function LineChart({
  series,
  showPoints = true,
  area = false,
  curve = "smooth",
  strokeWidth = 3.5,
  formatValue = DEFAULT_FORMAT,
  ...props
}: LineChartProps) {
  // What is drawn: the same data, interpolated while it changes. `series`
  // itself still goes to `ChartFrame`, whose `sr-only` table must read the
  // real values rather than whatever frame the animation is on.
  const plotted = useAnimatedSeries(series);
  const { points, max, min, range } = chartGeometry(plotted);
  // Gradient ids have to be unique per chart instance: two LineCharts on one
  // page sharing an id means the second one's `fill="url(#...)"` resolves to
  // the first one's gradient. `useId` is SSR-stable, unlike a counter.
  const gradientId = React.useId();
  const [cursor, setCursor] = React.useState<PlotCursor>(null);
  const clear = (seriesIndex: number, pointIndex: number) =>
    setCursor((current) =>
      current?.series === seriesIndex && current.point === pointIndex ? null : current,
    );
  const labels = plotted.find((item) => item.data.length > 0)?.data.map((point) => point.label) ?? [];
  const x = (index: number) =>
    points <= 1 ? PLOT.left + PLOT_WIDTH / 2 : PLOT.left + (index / (points - 1)) * PLOT_WIDTH;
  const y = (value: number) => PLOT.top + PLOT_HEIGHT - ((value - min) / range) * PLOT_HEIGHT;

  const pointAt = React.useCallback(
    (seriesIndex: number, pointIndex: number): HoveredPoint | null => {
      const item = plotted[seriesIndex];
      const point = item?.data[pointIndex];
      if (!item || !point) return null;
      return {
        // Named `pointKey`, not `key` - this object is spread onto
        // `<ChartTooltip>` below, and a "key" field in a spread props object
        // triggers React's reserved-prop-name warning.
        pointKey: `${item.name}-${point.label}`,
        x: x(pointIndex),
        y: y(point.value),
        label: point.label,
        name: item.name,
        value: point.value,
        color: item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
      };
    },
    // `x`/`y` are recreated each render and close over the same geometry the
    // deps below describe, so listing the geometry is both correct and stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plotted, points, max, min, range],
  );
  const hovered = cursor ? pointAt(cursor.series, cursor.point) : null;
  const onKeyDown = usePlotKeyboard(plotted, setCursor);

  // Crosshair: the pointer anywhere over the plot snaps to the nearest x
  // index and highlights the series whose point is closest vertically, so
  // the chart is readable without having to land on a 5px dot.
  const onMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (points === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const vx = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const vy = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
    const index = Math.max(
      0,
      Math.min(points - 1, Math.round(((vx - PLOT.left) / PLOT_WIDTH) * (points - 1))),
    );
    let best: PlotCursor = null;
    let bestDistance = Infinity;
    plotted.forEach((_, seriesIndex) => {
      const candidate = pointAt(seriesIndex, index);
      if (!candidate) return;
      const distance = Math.abs(candidate.y - vy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { series: seriesIndex, point: index };
      }
    });
    // Only re-render when the snapped point actually changes - every
    // mousemove otherwise rebuilt the whole SVG.
    setCursor((current) =>
      current?.series === best?.series && current?.point === best?.point ? current : best,
    );
  };

  return (
    <ChartFrame series={series} formatValue={formatValue} {...props}>
      <div className="fj:min-w-0 fj:overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className={PLOT_SVG_CLASS}
          role="img"
          aria-label={props.title ?? "Line chart"}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setCursor(null)}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setCursor(null)}
        >
          {area && (
            <defs>
              {plotted.map((item, seriesIndex) => (
                <linearGradient
                  key={item.name}
                  id={`${gradientId}-${seriesIndex}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length]}
                    stopOpacity="0.18"
                  />
                  <stop
                    offset="100%"
                    stopColor={item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length]}
                    stopOpacity="0"
                  />
                </linearGradient>
              ))}
            </defs>
          )}
          <Axis labels={labels} max={max} min={min} range={range} formatValue={formatValue} />
          {plotted.map((item, seriesIndex) => {
            const color = item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
            const pts = item.data.map((point, index) => [x(index), y(point.value)] as [number, number]);
            const path =
              curve === "smooth"
                ? monotonePath(pts)
                : pts.map(([px, py], index) => `${index === 0 ? "M" : "L"} ${px} ${py}`).join(" ");
            const baseline = PLOT.top + PLOT_HEIGHT;
            const areaPath =
              area && item.data.length > 1
                ? `${path} L ${x(item.data.length - 1)} ${baseline} L ${x(0)} ${baseline} Z`
                : null;
            return (
              <g key={item.name}>
                {areaPath && (
                  <path
                    className="fuji-chart-area"
                    d={areaPath}
                    fill={`url(#${gradientId}-${seriesIndex})`}
                  />
                )}
                <path
                  className="fuji-chart-line"
                  pathLength="1"
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {showPoints &&
                  item.data.map((point, index) => {
                    const key = `${item.name}-${point.label}`;
                    return (
                      <circle
                        key={key}
                        className="fuji-chart-point"
                        style={{ "--fuji-chart-index": index } as React.CSSProperties}
                        cx={x(index)}
                        cy={y(point.value)}
                        r="5"
                        fill="var(--fuji-surface)"
                        stroke={color}
                        strokeWidth="2"
                        onMouseEnter={() => setCursor({ series: seriesIndex, point: index })}
                        onMouseLeave={() => clear(seriesIndex, index)}
                      />
                    );
                  })}
              </g>
            );
          })}
          {hovered && (
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PLOT.top}
              y2={PLOT.top + PLOT_HEIGHT}
              stroke="var(--fuji-foreground-subtle)"
              strokeDasharray="2 4"
              pointerEvents="none"
            />
          )}
          {hovered && <ChartTooltip {...hovered} formatValue={formatValue} />}
        </svg>
      </div>
    </ChartFrame>
  );
}

export interface BarChartProps extends ChartBaseProps {
  /** One entry per bar group. Changing the values animates the bars to their new heights. */
  series: ChartSeries[];
  /**
   * Labels of the bars to emphasise. When set, every other bar is painted in
   * a muted tint, the highlighted bars take their series colour and carry a
   * value tag, and their x-axis label sits in a pill - the dashboard look
   * where one period is "the" number. Omit to colour every bar.
   */
  highlight?: string | string[];
  /**
   * Draws a dotted reference line at this value with a small tag - an
   * average, a target, a budget.
   */
  average?: number;
  /** Names the `average` line's tag. Default "Avg". */
  averageLabel?: string;
}

/** Value tag over a highlighted bar: a dark chip with a pointer. */
function BarValueTag({ x, y, text }: { x: number; y: number; text: string }) {
  const width = Math.max(34, text.length * 6.2 + 14);
  const height = 18;
  const left = Math.max(PLOT.left, Math.min(x - width / 2, VIEWBOX_WIDTH - PLOT.right - width));
  const top = Math.max(2, y - height - 8);
  return (
    <g pointerEvents="none">
      <rect x={left} y={top} width={width} height={height} rx="5" fill="var(--fuji-foreground)" />
      <path d={`M${x - 4} ${top + height} l4 4 l4 -4z`} fill="var(--fuji-foreground)" />
      <text
        x={left + width / 2}
        y={top + 12.5}
        textAnchor="middle"
        fill="var(--fuji-background)"
        fontSize="10"
        fontWeight="600"
      >
        {text}
      </text>
    </g>
  );
}

export function BarChart({
  series,
  formatValue = DEFAULT_FORMAT,
  highlight,
  average,
  averageLabel = "Avg",
  ...props
}: BarChartProps) {
  // See `useAnimatedSeries`: what is drawn is the data mid-move, while
  // `ChartFrame` below still receives the real values for its `sr-only` table.
  const plotted = useAnimatedSeries(series);
  const { points, max, min, range } = chartGeometry(plotted);
  const [cursor, setCursor] = React.useState<PlotCursor>(null);
  const clear = (seriesIndex: number, pointIndex: number) =>
    setCursor((current) =>
      current?.series === seriesIndex && current.point === pointIndex ? null : current,
    );
  const labels = plotted.find((item) => item.data.length > 0)?.data.map((point) => point.label) ?? [];
  const highlighted = new Set(
    highlight === undefined ? [] : Array.isArray(highlight) ? highlight : [highlight],
  );
  const groupWidth = PLOT_WIDTH / Math.max(points, 1);
  // Thick, pill-shaped bars: most of the slot, capped so a short series
  // does not turn into slabs.
  const totalBarWidth = Math.min(groupWidth * 0.64, 56 * Math.max(plotted.length, 1));
  const gap = plotted.length > 1 ? 4 : 0;
  const barWidth = Math.max((totalBarWidth - gap * (plotted.length - 1)) / Math.max(plotted.length, 1), 6);
  const baseY = PLOT.top + PLOT_HEIGHT - ((0 - min) / range) * PLOT_HEIGHT;
  const xFor = (index: number) => PLOT.left + index * groupWidth + groupWidth / 2;
  const y = (value: number) => PLOT.top + PLOT_HEIGHT - ((value - min) / range) * PLOT_HEIGHT;
  const barX = (pointIndex: number, seriesIndex: number) =>
    xFor(pointIndex) - totalBarWidth / 2 + seriesIndex * (barWidth + gap);

  const pointAt = React.useCallback(
    (seriesIndex: number, pointIndex: number): HoveredPoint | null => {
      const item = plotted[seriesIndex];
      const point = item?.data[pointIndex];
      if (!item || !point) return null;
      return {
        pointKey: `${item.name}-${point.label}`,
        x: barX(pointIndex, seriesIndex) + barWidth / 2,
        y: point.value >= 0 ? y(point.value) : baseY,
        label: point.label,
        name: item.name,
        value: point.value,
        color: item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plotted, points, max, min, range, groupWidth, totalBarWidth, barWidth, baseY],
  );
  const hovered = cursor ? pointAt(cursor.series, cursor.point) : null;
  const onKeyDown = usePlotKeyboard(plotted, setCursor);

  return (
    <ChartFrame series={series} formatValue={formatValue} {...props}>
      <div className="fj:min-w-0 fj:overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className={PLOT_SVG_CLASS}
          role="img"
          aria-label={props.title ?? "Bar chart"}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setCursor(null)}
          onMouseLeave={() => setCursor(null)}
        >
          <Axis
            labels={labels}
            max={max}
            min={min}
            range={range}
            formatValue={formatValue}
            highlighted={highlighted}
          />
          {/* Baseline, so negative bars visibly hang from zero. */}
          {min < 0 && (
            <line
              x1={PLOT.left}
              x2={VIEWBOX_WIDTH - PLOT.right}
              y1={baseY}
              y2={baseY}
              stroke="var(--fuji-border-strong)"
            />
          )}
          {plotted.map((item, seriesIndex) => {
            const color = item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
            return item.data.map((point, index) => {
              const height = Math.max(Math.abs(y(point.value) - baseY), 3);
              const x = barX(index, seriesIndex);
              const barY = point.value >= 0 ? y(point.value) : baseY;
              const key = `${item.name}-${point.label}`;
              const isHighlighted = highlighted.has(point.label);
              const muted = highlighted.size > 0 && !isHighlighted;
              return (
                <g key={key}>
                  <rect
                    x={x}
                    y={barY}
                    width={barWidth}
                    height={height}
                    rx={Math.min(barWidth / 2, 8)}
                    // Muted bars take a theme-tuned neutral rather than a
                    // faded series colour, so they stay visible on dark
                    // and glass surfaces too.
                    fill={muted ? "var(--fuji-border-strong)" : color}
                    className="fuji-chart-bar"
                    style={
                      {
                        "--fuji-chart-index": index,
                        transformOrigin: `${x + barWidth / 2}px ${point.value >= 0 ? baseY : barY}px`,
                      } as React.CSSProperties
                    }
                    onMouseEnter={() => setCursor({ series: seriesIndex, point: index })}
                    onMouseLeave={() => clear(seriesIndex, index)}
                  />
                  {isHighlighted && (
                    <BarValueTag x={x + barWidth / 2} y={barY} text={formatValue(point.value)} />
                  )}
                </g>
              );
            });
          })}
          {average !== undefined && (
            <g pointerEvents="none">
              <line
                x1={PLOT.left}
                x2={VIEWBOX_WIDTH - PLOT.right}
                y1={y(average)}
                y2={y(average)}
                stroke="var(--fuji-foreground-muted)"
                strokeDasharray="2 4"
              />
              <rect
                x={PLOT.left}
                y={y(average) - 9}
                width={Math.max(40, (averageLabel.length + formatValue(average).length) * 5.6 + 12)}
                height={18}
                rx="5"
                fill="var(--fuji-foreground)"
              />
              <text
                x={PLOT.left + 6}
                y={y(average) + 3.5}
                fill="var(--fuji-background)"
                fontSize="9.5"
                fontWeight="600"
              >
                {averageLabel} {formatValue(average)}
              </text>
            </g>
          )}
          {hovered && !highlighted.has(hovered.label) && (
            <ChartTooltip {...hovered} formatValue={formatValue} />
          )}
        </svg>
      </div>
    </ChartFrame>
  );
}

export interface DonutChartProps extends ChartBaseProps {
  /** The slices. Changing the values animates the ring and its figures. */
  data: ChartPoint[];
  /** Overrides the figure in the ring's hole. Defaults to the formatted total. */
  centerLabel?: string;
}

export function DonutChart({
  data,
  centerLabel,
  formatValue = DEFAULT_FORMAT,
  legend: _legend,
  ...props
}: DonutChartProps) {
  const series = React.useMemo(() => [{ name: "Values", data }], [data]);
  // See `useAnimatedSeries`: the ring, its legend figures and the centre total
  // all travel to new data. `ChartFrame` still gets `series` - the real values.
  const plotted = useAnimatedSeries(series)[0].data;
  const total = plotted.reduce((sum, point) => sum + point.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  // Mask ids must be unique per instance - two donuts on one page sharing an
  // id means the second resolves the first one's mask.
  const maskId = React.useId();

  // Each segment's start fraction and its mid-angle, for the tooltip anchor.
  let running = 0;
  const segments = plotted.map((point) => {
    const fraction = total ? point.value / total : 0;
    const start = running;
    running += fraction;
    return { point, fraction, start, mid: start + fraction / 2 };
  });

  const hovered = hoveredIndex !== null ? segments[hoveredIndex] : null;
  // The anchor sits just outside the ring at the segment's mid-angle, in
  // percent of the 160x160 box (12 o'clock is angle -90deg).
  const anchorAngle = hovered ? hovered.mid * 2 * Math.PI - Math.PI / 2 : 0;
  // Clamped so a ~140px tooltip centred on the anchor stays inside the
  // card's padding rather than hanging off its edge.
  const anchorX = Math.min(65, Math.max(35, 50 + (Math.cos(anchorAngle) * (radius + 16)) / 1.6));
  const anchorY = Math.min(100, Math.max(0, 50 + (Math.sin(anchorAngle) * (radius + 16)) / 1.6));

  return (
    // No frame legend: the value list beside the ring IS the legend, and the
    // frame's would only repeat the series' placeholder name.
    <ChartFrame series={series} formatValue={formatValue} {...props}>
      <div className="fj:flex fj:min-w-0 fj:flex-wrap fj:items-center fj:justify-center fj:gap-6">
        <div className="fj:relative fj:size-44 fj:shrink-0">
          {/*
            Not focusable and not arrow-navigable, unlike the line/bar plots:
            every segment's label and value is already listed in the visible
            legend beside it (and again in ChartFrame's `sr-only` table), so a
            keyboard cursor here would only re-read what is on screen.
          */}
          <svg
            viewBox="0 0 160 160"
            className="fj:size-full fj:-rotate-90 fj:overflow-visible"
            role="img"
            aria-label={props.title ?? "Donut chart"}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/*
              Draw-in. The segments are painted through a mask whose only
              content is one ring stroke that sweeps clockwise (the same
              `.fuji-chart-line` dash animation the line chart uses, via
              `pathLength="1"`), so the whole donut reveals in order from 12
              o'clock without each segment needing its own timing.
            */}
            <mask id={maskId}>
              <circle
                className="fuji-chart-line"
                pathLength="1"
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#fff"
                strokeWidth="30"
              />
            </mask>
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="var(--fuji-surface-strong)"
              strokeWidth="22"
            />
            {/* `.fuji-donut-ring` casts the theme's drop shadow so the ring
                itself stands off the card - deeper under `floating`. */}
            <g mask={`url(#${maskId})`} className="fuji-donut-ring">
              {segments.map(({ point, fraction, start }, index) => {
                const length = fraction * circumference;
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
                    strokeDashoffset={-start * circumference}
                    // The hovered segment thickens outward - the only segment
                    // state the reference dashboards show, and the cue that the
                    // tooltip belongs to it.
                    className="fuji-chart-segment"
                    data-active={hoveredIndex === index || undefined}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
                  />
                );
              })}
            </g>
          </svg>
          <span className="fj:pointer-events-none fj:absolute fj:inset-0 fj:flex fj:flex-col fj:items-center fj:justify-center fj:text-center">
            {/* Sized to the ring's hole (~100px at this radius): a word like
                "Sessions" at the lg scale ran into the ring on both sides. */}
            <strong className="fj:max-w-[5.5rem] fj:truncate fj:text-[length:var(--fuji-text-md)] fj:text-fuji-foreground">
              {centerLabel ?? formatValue(total)}
            </strong>
            <span className="fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-muted">Total</span>
          </span>
          {/*
            HTML, not SVG: the ring's 160-unit viewBox is far too small for
            the SVG tooltip the plots use (it was clipped to a sliver), and an
            HTML tooltip can use the real overlay surface and shadow. Anchored
            just outside the hovered segment's mid-angle.
          */}
          {hovered && (
            <div
              role="tooltip"
              className="fuji-glass-surface-overlay fuji-motion-popup fj:pointer-events-none fj:absolute fj:z-10 fj:flex fj:-translate-x-1/2 fj:-translate-y-1/2 fj:items-center fj:gap-2 fj:rounded-fuji-control fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:px-2.5 fj:py-1.5 fj:text-[length:var(--fuji-text-xs)] fj:whitespace-nowrap fj:text-fuji-foreground fj:shadow-fuji-overlay"
              style={{ left: `${anchorX}%`, top: `${anchorY}%` }}
            >
              <span
                className="fj:size-2 fj:shrink-0 fj:rounded-full"
                style={{ backgroundColor: SERIES_COLORS[(hoveredIndex ?? 0) % SERIES_COLORS.length] }}
              />
              <span className="fj:font-medium">{hovered.point.label}</span>
              <span className="fj:text-fuji-foreground-muted">
                {formatValue(hovered.point.value)} · {Math.round(hovered.fraction * 100)}%
              </span>
            </div>
          )}
        </div>
        <div className="fj:flex fj:flex-col fj:gap-2">
          {segments.map(({ point, fraction }, index) => (
            <span
              key={point.label}
              className={cn(
                "fj:flex fj:cursor-default fj:items-center fj:gap-2 fj:rounded-fuji-control fj:px-1.5 fj:py-0.5 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
                // `fuji-hover-raised` rather than a bare fill: this row carries
                // its label and value text, and under dark glass a fill alone
                // cannot separate from a near-black panel - the class pairs the
                // fill with a hairline that reads at any backdrop brightness.
                // `data-raised` (not just `:hover`) because hovering the chart
                // segment highlights its legend row too.
                "fuji-hover-raised",
              )}
              data-raised={hoveredIndex === index || undefined}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
            >
              <span
                className="fj:size-2 fj:rounded-full"
                style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
              />
              <span>{point.label}</span>
              <span className="fj:ml-auto fj:pl-4 fj:text-fuji-foreground">{formatValue(point.value)}</span>
              <span className="fj:w-9 fj:text-right fj:text-fuji-foreground-subtle fj:tabular-nums">
                {Math.round(fraction * 100)}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

"use client"

import {
  CalendarDays,
  Clock,
  Cloud,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Navigation,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  type City,
  type Unit,
  type Weather,
  cityLabel,
  convertTemp,
  formatClock,
  formatHour,
  formatMonthDay,
  formatTemp,
  getCondition,
  hourOf,
  minutesOfDay,
  uvLevel,
  weekdayOf,
  windDirectionLabel,
} from "@/lib/weather"

type CardProps = { weather: Weather; unit: Unit; className?: string }

/* ---------- 오늘 날씨 (메인) ---------- */

function buildSummary(weather: Weather) {
  const rainy = weather.hourly.find((h) => h.precipitationProbability >= 50)
  if (rainy) {
    const when = rainy === weather.hourly[0] ? "지금" : `${formatHour(rainy.time)}쯤`
    return `${when} 비 소식이 있어요 (강수확률 ${rainy.precipitationProbability}%). 우산을 챙기세요.`
  }
  const maxProb = Math.max(...weather.hourly.map((h) => h.precipitationProbability))
  if (maxProb >= 30) return `24시간 내 강수확률이 최대 ${maxProb}%예요. 작은 우산이 있으면 좋아요.`
  return "앞으로 24시간 동안 비 소식은 없어요."
}

// 앞으로 24시간 중 아침·오후·저녁·새벽 대표 시각
const DAY_PARTS = [
  { hour: 9, label: "아침" },
  { hour: 15, label: "오후" },
  { hour: 21, label: "저녁" },
  { hour: 3, label: "새벽" },
]

function dayParts(weather: Weather) {
  return weather.hourly
    .map((point) => ({ point, part: DAY_PARTS.find((p) => p.hour === hourOf(point.time)) }))
    .filter((x) => x.part)
    .map((x) => ({ point: x.point, label: x.part!.label }))
}

export function CurrentCard({ weather, unit, city, className }: CardProps & { city: City }) {
  const { current, daily } = weather
  const today = daily[0]
  const cond = getCondition(current.weatherCode, current.isDay)
  const Icon = cond.icon

  return (
    <Card className={cn("relative bg-linear-to-br from-primary/10 via-card to-card", className)}>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary" />
          {cityLabel(city) || "현재 위치"}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold">{city.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-7xl font-light tracking-tighter tabular-nums">
              {formatTemp(current.temperature, unit)}
            </div>
            <div className="mt-1 text-lg font-medium">{cond.label}</div>
          </div>
          <Icon className={cn("size-24 shrink-0 stroke-[1.25]", cond.tone)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <ThermometerSun className="size-3.5 text-rose-500" />
            최고 {formatTemp(today.max, unit)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <ThermometerSnowflake className="size-3.5 text-sky-500" />
            최저 {formatTemp(today.min, unit)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Umbrella className="size-3.5 text-primary" />
            강수 {today.precipitationProbability}%
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {dayParts(weather).map((part) => {
            const pc = getCondition(part.point.weatherCode, part.point.isDay)
            const PartIcon = pc.icon
            return (
              <div key={part.point.time} className="flex flex-col items-center gap-1.5 rounded-lg border bg-card/60 py-2.5">
                <span className="text-xs text-muted-foreground">{part.label}</span>
                <PartIcon className={cn("size-5", pc.tone)} />
                <span className="text-sm font-semibold tabular-nums">{formatTemp(part.point.temperature, unit)}</span>
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
                  <Droplets className="size-3" />
                  {part.point.precipitationProbability}%
                </span>
              </div>
            )
          })}
        </div>

        <p className="mt-auto rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">
          {buildSummary(weather)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          현지 시각 {formatClock(current.time)} 기준
        </p>
      </CardContent>
    </Card>
  )
}

/* ---------- 상세 지표 타일 ---------- */

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
}) {
  return (
    <Card size="sm" className="gap-1.5">
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function StatsGrid({ weather, unit, className }: CardProps) {
  const c = weather.current
  const today = weather.daily[0]
  const feelsDiff = Math.round(convertTemp(c.apparentTemperature, unit) - convertTemp(c.temperature, unit))

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      <StatTile
        icon={Thermometer}
        label="체감 온도"
        value={formatTemp(c.apparentTemperature, unit)}
        sub={feelsDiff === 0 ? "실제 기온과 비슷" : `실제보다 ${Math.abs(feelsDiff)}° ${feelsDiff > 0 ? "높음" : "낮음"}`}
      />
      <StatTile icon={Droplets} label="습도" value={`${c.humidity}%`} sub={c.humidity >= 70 ? "습함" : c.humidity <= 30 ? "건조함" : "쾌적함"} />
      <StatTile
        icon={Wind}
        label="바람"
        value={
          <span className="flex items-baseline gap-1">
            {Math.round(c.windSpeed)}
            <span className="text-sm font-normal text-muted-foreground">km/h</span>
          </span>
        }
        sub={
          <span className="flex items-center gap-1">
            <Navigation className="size-3" style={{ transform: `rotate(${c.windDirection + 180}deg)` }} />
            {windDirectionLabel(c.windDirection)}풍
          </span>
        }
      />
      <StatTile icon={Sun} label="자외선" value={Math.round(c.uvIndex)} sub={`${uvLevel(c.uvIndex)} · 최대 ${Math.round(today.uvIndexMax)}`} />
      <StatTile
        icon={Umbrella}
        label="오늘 강수량"
        value={
          <span className="flex items-baseline gap-1">
            {today.precipitationSum.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground">mm</span>
          </span>
        }
        sub={`현재 ${c.precipitation.toFixed(1)}mm`}
      />
      <StatTile icon={Cloud} label="구름" value={`${c.cloudCover}%`} sub={c.cloudCover < 30 ? "하늘이 맑음" : c.cloudCover < 70 ? "구름 약간" : "구름 많음"} />
      <StatTile
        icon={Gauge}
        label="기압"
        value={
          <span className="flex items-baseline gap-1">
            {Math.round(c.pressure)}
            <span className="text-sm font-normal text-muted-foreground">hPa</span>
          </span>
        }
        sub={c.pressure >= 1013 ? "고기압" : "저기압"}
      />
      <StatTile
        icon={Eye}
        label="가시거리"
        value={
          <span className="flex items-baseline gap-1">
            {(c.visibility / 1000).toFixed(c.visibility >= 10000 ? 0 : 1)}
            <span className="text-sm font-normal text-muted-foreground">km</span>
          </span>
        }
        sub={c.visibility >= 10000 ? "매우 좋음" : c.visibility >= 4000 ? "보통" : "나쁨"}
      />
    </div>
  )
}

/* ---------- 24시간 예보 ---------- */

const COL = 64 // px, 시간 한 칸 너비

export function HourlyCard({ weather, unit, className }: CardProps) {
  const hours = weather.hourly
  const temps = hours.map((h) => convertTemp(h.temperature, unit))
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = max - min || 1
  const maxProb = Math.max(...hours.map((h) => h.precipitationProbability))
  const minIdx = temps.indexOf(min)
  const maxIdx = temps.indexOf(max)

  const H = 56
  const pad = 8
  const points = temps.map((t, i) => [i * COL + COL / 2, pad + (1 - (t - min) / range) * (H - pad * 2)] as const)
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")
  const area = `${line} L${points.at(-1)![0]},${H} L${points[0][0]},${H} Z`

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          24시간 예보
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            최저 <b className="text-sky-600 dark:text-sky-400">{Math.round(min)}°</b>
          </span>
          <span>
            최고 <b className="text-rose-600 dark:text-rose-400">{Math.round(max)}°</b>
          </span>
          <span>
            최대 강수확률 <b className="text-foreground">{maxProb}%</b>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="w-full">
          <div className="px-4 pb-3" style={{ width: hours.length * COL + 32 }}>
            {/* 시간 / 아이콘 / 기온 */}
            <div className="flex">
              {hours.map((h, i) => {
                const cond = getCondition(h.weatherCode, h.isDay)
                const Icon = cond.icon
                const isMidnight = i > 0 && hourOf(h.time) === 0
                return (
                  <div
                    key={h.time}
                    style={{ width: COL }}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-2 rounded-lg py-2",
                      i === 0 && "bg-primary/10",
                      isMidnight && "border-l border-dashed"
                    )}
                    title={cond.label}
                  >
                    <span className={cn("text-xs", i === 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
                      {i === 0 ? "지금" : isMidnight ? `${weekdayOf(h.time.slice(0, 10))}요일` : formatHour(h.time)}
                    </span>
                    <Icon className={cn("size-6", cond.tone)} />
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        i === maxIdx && "text-rose-600 dark:text-rose-400",
                        i === minIdx && "text-sky-600 dark:text-sky-400"
                      )}
                    >
                      {Math.round(temps[i])}°
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 기온 그래프 */}
            <svg width={hours.length * COL} height={H} className="block text-primary" aria-hidden>
              <defs>
                <linearGradient id="temp-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#temp-fill)" />
              <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i === 0 ? 4 : 2.5} className="fill-card" stroke="currentColor" strokeWidth="2" />
              ))}
            </svg>

            {/* 강수확률 */}
            <div className="mt-2 flex">
              {hours.map((h) => (
                <div key={h.time} style={{ width: COL }} className="flex shrink-0 flex-col items-center gap-1">
                  <div className="flex h-8 w-2 items-end overflow-hidden rounded-full bg-muted">
                    <div className="w-full rounded-full bg-sky-500" style={{ height: `${h.precipitationProbability}%` }} />
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs tabular-nums",
                      h.precipitationProbability >= 50 ? "font-semibold text-sky-600 dark:text-sky-400" : "text-muted-foreground"
                    )}
                  >
                    <Droplets className="size-3" />
                    {h.precipitationProbability}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/* ---------- 7일 예보 ---------- */

export function DailyCard({ weather, unit, className }: CardProps) {
  const days = weather.daily
  const weekMin = Math.min(...days.map((d) => d.min))
  const weekMax = Math.max(...days.map((d) => d.max))
  const span = weekMax - weekMin || 1

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          7일 예보
        </CardTitle>
        <CardDescription>일별 날씨, 강수확률, 최저·최고 기온</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {days.map((d, i) => {
            const cond = getCondition(d.weatherCode)
            const Icon = cond.icon
            const left = ((d.min - weekMin) / span) * 100
            const width = ((d.max - d.min) / span) * 100
            const wd = weekdayOf(d.date)
            return (
              <li
                key={d.date}
                className="grid grid-cols-[3.25rem_1fr_3.25rem_2.25rem_minmax(3rem,1fr)_2.25rem] items-center gap-2 py-2.5 sm:grid-cols-[4.5rem_minmax(7rem,1fr)_4rem_2.5rem_minmax(6rem,1.4fr)_2.5rem] sm:gap-3"
              >
                <div className="leading-tight">
                  <div
                    className={cn(
                      "font-medium",
                      i === 0 && "text-primary",
                      i !== 0 && wd === "일" && "text-rose-600 dark:text-rose-400",
                      i !== 0 && wd === "토" && "text-sky-600 dark:text-sky-400"
                    )}
                  >
                    {i === 0 ? "오늘" : `${wd}요일`}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatMonthDay(d.date)}</div>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className={cn("size-6 shrink-0", cond.tone)} />
                  <span className="hidden truncate text-sm sm:inline">{cond.label}</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs tabular-nums",
                    d.precipitationProbability >= 50 ? "font-semibold text-sky-600 dark:text-sky-400" : "text-muted-foreground"
                  )}
                >
                  <Droplets className="size-3.5" />
                  {d.precipitationProbability}%
                </div>
                <span className="text-right text-sm text-muted-foreground tabular-nums">{formatTemp(d.min, unit)}</span>
                <div className="relative h-1.5 rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 rounded-full bg-linear-to-r from-sky-400 via-amber-300 to-rose-400"
                    style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatTemp(d.max, unit)}</span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

/* ---------- 일출/일몰 ---------- */

export function SunCard({ weather, className }: Omit<CardProps, "unit">) {
  const today = weather.daily[0]
  const rise = minutesOfDay(today.sunrise)
  const set = minutesOfDay(today.sunset)
  const now = minutesOfDay(weather.current.time)
  const progress = Math.min(1, Math.max(0, (now - rise) / (set - rise)))
  const daylight = set - rise

  // 반원 궤적 위 태양 위치
  const W = 220
  const R = 90
  const cx = W / 2
  const cy = 100
  const angle = Math.PI * (1 - progress)
  const sx = cx + R * Math.cos(angle)
  const sy = cy - R * Math.sin(angle)
  const isUp = now >= rise && now <= set

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="size-4 text-amber-500" />
          일출 · 일몰
        </CardTitle>
        <CardDescription>
          낮 길이 {Math.floor(daylight / 60)}시간 {daylight % 60}분
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <svg viewBox={`0 0 ${W} 112`} className="w-full max-w-64" aria-hidden>
          <path d={`M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}`} fill="none" className="stroke-border" strokeWidth="2" strokeDasharray="4 4" />
          {isUp && (
            <path
              d={`M${cx - R},${cy} A${R},${R} 0 0 1 ${sx},${sy}`}
              fill="none"
              className="stroke-amber-400"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
          <line x1="8" x2={W - 8} y1={cy} y2={cy} className="stroke-border" />
          <circle cx={sx} cy={sy} r="8" className={isUp ? "fill-amber-400" : "fill-muted-foreground/40"} />
        </svg>
        <div className="grid w-full grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-2">
            <Sunrise className="size-4 text-amber-500" />
            <div>
              <div className="text-xs text-muted-foreground">일출</div>
              <div className="font-semibold tabular-nums">{formatClock(today.sunrise)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-2">
            <Sunset className="size-4 text-orange-500" />
            <div>
              <div className="text-xs text-muted-foreground">일몰</div>
              <div className="font-semibold tabular-nums">{formatClock(today.sunset)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- 이번 주 요약 ---------- */

export function WeekSummaryCard({ weather, unit, className }: CardProps) {
  const days = weather.daily
  const hottest = days.reduce((a, b) => (b.max > a.max ? b : a))
  const coldest = days.reduce((a, b) => (b.min < a.min ? b : a))
  const rainyDays = days.filter((d) => d.precipitationProbability >= 50)
  const totalRain = days.reduce((s, d) => s + d.precipitationSum, 0)

  const label = (date: string, i: number) => (i === 0 ? "오늘" : `${weekdayOf(date)}요일`)

  const rows = [
    {
      icon: ThermometerSun,
      tone: "text-rose-500",
      title: "가장 더운 날",
      value: `${label(hottest.date, days.indexOf(hottest))} ${formatTemp(hottest.max, unit)}`,
    },
    {
      icon: ThermometerSnowflake,
      tone: "text-sky-500",
      title: "가장 추운 날",
      value: `${label(coldest.date, days.indexOf(coldest))} ${formatTemp(coldest.min, unit)}`,
    },
    {
      icon: Umbrella,
      tone: "text-primary",
      title: "비 올 가능성 높은 날",
      value: rainyDays.length ? rainyDays.map((d) => label(d.date, days.indexOf(d)).replace("요일", "")).join(", ") : "없음",
    },
    {
      icon: Droplets,
      tone: "text-sky-500",
      title: "주간 누적 강수량",
      value: `${totalRain.toFixed(1)}mm`,
    },
  ]

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          이번 주 요약
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.title} className="flex items-center gap-2 text-sm">
              <r.icon className={cn("size-4 shrink-0", r.tone)} />
              <span className="text-muted-foreground">{r.title}</span>
              <span className="ml-auto truncate font-semibold tabular-nums">{r.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

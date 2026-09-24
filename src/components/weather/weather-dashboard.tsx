"use client"

import * as React from "react"
import { CloudSun, Moon, RefreshCw, Sun, TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CitySearch } from "@/components/weather/city-search"
import {
  CurrentCard,
  DailyCard,
  HourlyCard,
  StatsGrid,
  SunCard,
  WeekSummaryCard,
} from "@/components/weather/weather-cards"
import { cn } from "@/lib/utils"
import { useStoredState } from "@/hooks/use-stored-state"
import { type City, type Unit, type Weather, DEFAULT_CITY, fetchWeather } from "@/lib/weather"

const isCity = (v: unknown): v is City =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as City).name === "string" &&
  typeof (v as City).latitude === "number" &&
  typeof (v as City).longitude === "number"
const isUnit = (v: unknown): v is Unit => v === "c" || v === "f"

type Result = { key: string; weather?: Weather; error?: string }

export function WeatherDashboard() {
  const [city, setCity] = useStoredState<City>("myweather:city", DEFAULT_CITY, isCity)
  const [unit, setUnit] = useStoredState<Unit>("myweather:unit", "c", isUnit)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [result, setResult] = React.useState<Result | null>(null)
  const [lastWeather, setLastWeather] = React.useState<Weather | null>(null)

  const requestKey = `${city.latitude},${city.longitude}#${reloadKey}`
  const loading = result?.key !== requestKey
  const error = !loading ? result?.error : undefined
  const weather = !loading && result?.weather ? result.weather : lastWeather

  React.useEffect(() => {
    const controller = new AbortController()
    fetchWeather(city, controller.signal)
      .then((w) => {
        setResult({ key: requestKey, weather: w })
        setLastWeather(w)
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setResult({ key: requestKey, error: e.message })
      })
    return () => controller.abort()
    // requestKey가 city 좌표와 reloadKey를 모두 포함한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  function changeUnit(next: string) {
    if (isUnit(next)) setUnit(next)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CloudSun className="size-5" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">MyWeather</h1>
            <p className="text-xs text-muted-foreground">Open-Meteo 기반 날씨</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 sm:flex-none">
            <CitySearch city={city} onSelect={setCity} />
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={unit}
            onValueChange={changeUnit}
            aria-label="온도 단위"
          >
            <ToggleGroupItem value="c" aria-label="섭씨" className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              °C
            </ToggleGroupItem>
            <ToggleGroupItem value="f" aria-label="화씨" className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              °F
            </ToggleGroupItem>
          </ToggleGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setReloadKey((k) => k + 1)}
                disabled={loading}
                aria-label="새로고침"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>새로고침</TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>날씨 정보를 가져오지 못했어요</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              다시 시도
            </Button>
          </AlertDescription>
        </Alert>
      ) : !weather ? (
        <DashboardSkeleton />
      ) : (
        <main
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity md:grid-cols-12",
            loading && "opacity-60"
          )}
        >
          <CurrentCard weather={weather} unit={unit} city={city} className="md:col-span-5 lg:col-span-4 lg:row-span-2" />
          <StatsGrid weather={weather} unit={unit} className="md:col-span-7 lg:col-span-8" />
          <HourlyCard weather={weather} unit={unit} className="md:col-span-12 lg:col-span-8" />
          <DailyCard weather={weather} unit={unit} className="md:col-span-7 lg:col-span-8" />
          <div className="grid gap-4 md:col-span-5 lg:col-span-4">
            <SunCard weather={weather} />
            <WeekSummaryCard weather={weather} unit={unit} />
          </div>
        </main>
      )}

      <footer className="pt-2 text-center text-xs text-muted-foreground">
        Weather data by{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Open-Meteo.com
        </a>
      </footer>
    </div>
  )
}

function ThemeToggle() {
  function toggle() {
    const dark = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem("myweather:theme", dark ? "dark" : "light")
    } catch {}
  }
  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label="테마 전환">
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <Skeleton className="h-80 md:col-span-5 lg:col-span-4 lg:row-span-2 lg:h-auto" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:col-span-7 lg:col-span-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72 md:col-span-12 lg:col-span-8" />
      <Skeleton className="h-96 md:col-span-7 lg:col-span-8" />
      <Skeleton className="h-96 md:col-span-5 lg:col-span-4" />
    </div>
  )
}

import type { LucideIcon } from "lucide-react"
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
} from "lucide-react"

export type City = {
  id: number | string
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export type Unit = "c" | "f"

export type HourlyPoint = {
  time: string
  temperature: number
  precipitationProbability: number
  weatherCode: number
  isDay: boolean
}

export type DailyPoint = {
  date: string
  weatherCode: number
  max: number
  min: number
  precipitationProbability: number
  precipitationSum: number
  sunrise: string
  sunset: string
  uvIndexMax: number
}

export type Weather = {
  current: {
    time: string
    temperature: number
    apparentTemperature: number
    humidity: number
    isDay: boolean
    precipitation: number
    weatherCode: number
    cloudCover: number
    pressure: number
    windSpeed: number
    windDirection: number
    uvIndex: number
    visibility: number
  }
  hourly: HourlyPoint[]
  daily: DailyPoint[]
}

export const DEFAULT_CITY: City = {
  id: 1835848,
  name: "서울",
  latitude: 37.566,
  longitude: 126.9784,
  country: "대한민국",
}

export const POPULAR_CITIES: City[] = [
  DEFAULT_CITY,
  { id: 1838524, name: "부산", latitude: 35.1028, longitude: 129.0403, country: "대한민국" },
  { id: 1843564, name: "인천", latitude: 37.4565, longitude: 126.7052, country: "대한민국" },
  { id: 1835329, name: "대구", latitude: 35.8703, longitude: 128.5911, country: "대한민국" },
  { id: 1835235, name: "대전", latitude: 36.3491, longitude: 127.3849, country: "대한민국" },
  { id: 1841811, name: "광주", latitude: 35.1547, longitude: 126.9156, country: "대한민국" },
  { id: 1846266, name: "제주", latitude: 33.5097, longitude: 126.5219, country: "대한민국" },
  { id: 1850147, name: "도쿄", latitude: 35.6895, longitude: 139.6917, country: "일본" },
  { id: 5128581, name: "뉴욕", latitude: 40.7143, longitude: -74.006, country: "미국" },
  { id: 2643743, name: "런던", latitude: 51.5085, longitude: -0.1257, country: "영국" },
]

type RawForecast = {
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    is_day: number
    precipitation: number
    weather_code: number
    cloud_cover: number
    pressure_msl: number
    wind_speed_10m: number
    wind_direction_10m: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: (number | null)[]
    weather_code: number[]
    is_day: number[]
    uv_index: (number | null)[]
    visibility: (number | null)[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: (number | null)[]
    precipitation_sum: number[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: (number | null)[]
  }
}

export async function fetchWeather(city: City, signal?: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day,uv_index,visibility",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "8",
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
  if (!res.ok) throw new Error(`날씨 정보를 불러오지 못했습니다 (${res.status})`)
  const raw: RawForecast = await res.json()

  const c = raw.current
  const h = raw.hourly
  const d = raw.daily

  // 현재 시각이 속한 시간대부터 24시간
  const currentHour = c.time.slice(0, 13)
  const start = Math.max(0, h.time.findIndex((t) => t.startsWith(currentHour)))
  const hourly: HourlyPoint[] = h.time.slice(start, start + 24).map((time, i) => ({
    time,
    temperature: h.temperature_2m[start + i],
    precipitationProbability: h.precipitation_probability[start + i] ?? 0,
    weatherCode: h.weather_code[start + i],
    isDay: h.is_day[start + i] === 1,
  }))

  const daily: DailyPoint[] = d.time.slice(0, 7).map((date, i) => ({
    date,
    weatherCode: d.weather_code[i],
    max: d.temperature_2m_max[i],
    min: d.temperature_2m_min[i],
    precipitationProbability: d.precipitation_probability_max[i] ?? 0,
    precipitationSum: d.precipitation_sum[i],
    sunrise: d.sunrise[i],
    sunset: d.sunset[i],
    uvIndexMax: d.uv_index_max[i] ?? 0,
  }))

  return {
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      apparentTemperature: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      isDay: c.is_day === 1,
      precipitation: c.precipitation,
      weatherCode: c.weather_code,
      cloudCover: c.cloud_cover,
      pressure: c.pressure_msl,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      uvIndex: h.uv_index[start] ?? 0,
      visibility: h.visibility[start] ?? 0,
    },
    hourly,
    daily,
  }
}

type RawGeo = {
  results?: {
    id: number
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
  }[]
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const params = new URLSearchParams({ name: query, count: "8", language: "ko", format: "json" })
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal })
  if (!res.ok) throw new Error("도시 검색에 실패했습니다")
  const raw: RawGeo = await res.json()
  return (raw.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
  }))
}

type Condition = { label: string; icon: LucideIcon; nightIcon?: LucideIcon; tone: string }

const CONDITIONS: Record<number, Condition> = {
  0: { label: "맑음", icon: Sun, nightIcon: Moon, tone: "text-amber-500" },
  1: { label: "대체로 맑음", icon: CloudSun, nightIcon: CloudMoon, tone: "text-amber-500" },
  2: { label: "구름 조금", icon: CloudSun, nightIcon: CloudMoon, tone: "text-sky-500" },
  3: { label: "흐림", icon: Cloud, tone: "text-slate-500 dark:text-slate-400" },
  45: { label: "안개", icon: CloudFog, tone: "text-slate-500 dark:text-slate-400" },
  48: { label: "짙은 안개", icon: CloudFog, tone: "text-slate-500 dark:text-slate-400" },
  51: { label: "약한 이슬비", icon: CloudDrizzle, tone: "text-sky-500" },
  53: { label: "이슬비", icon: CloudDrizzle, tone: "text-sky-500" },
  55: { label: "강한 이슬비", icon: CloudDrizzle, tone: "text-sky-600" },
  56: { label: "어는 이슬비", icon: CloudDrizzle, tone: "text-cyan-500" },
  57: { label: "강한 어는 이슬비", icon: CloudDrizzle, tone: "text-cyan-500" },
  61: { label: "약한 비", icon: CloudRain, tone: "text-sky-500" },
  63: { label: "비", icon: CloudRain, tone: "text-sky-600" },
  65: { label: "강한 비", icon: CloudRain, tone: "text-blue-600" },
  66: { label: "어는 비", icon: CloudRain, tone: "text-cyan-500" },
  67: { label: "강한 어는 비", icon: CloudRain, tone: "text-cyan-600" },
  71: { label: "약한 눈", icon: CloudSnow, tone: "text-cyan-400" },
  73: { label: "눈", icon: CloudSnow, tone: "text-cyan-500" },
  75: { label: "폭설", icon: Snowflake, tone: "text-cyan-500" },
  77: { label: "싸락눈", icon: CloudSnow, tone: "text-cyan-400" },
  80: { label: "약한 소나기", icon: CloudRain, tone: "text-sky-500" },
  81: { label: "소나기", icon: CloudRain, tone: "text-sky-600" },
  82: { label: "강한 소나기", icon: CloudRain, tone: "text-blue-600" },
  85: { label: "약한 눈소나기", icon: CloudSnow, tone: "text-cyan-400" },
  86: { label: "강한 눈소나기", icon: Snowflake, tone: "text-cyan-500" },
  95: { label: "뇌우", icon: CloudLightning, tone: "text-violet-500" },
  96: { label: "우박 동반 뇌우", icon: CloudHail, tone: "text-violet-500" },
  99: { label: "강한 우박 뇌우", icon: CloudHail, tone: "text-violet-600" },
}

export function getCondition(code: number, isDay = true) {
  const c = CONDITIONS[code] ?? { label: "알 수 없음", icon: Cloud, tone: "text-muted-foreground" }
  const nightTone = c.nightIcon ? "text-indigo-400" : c.tone
  return {
    label: c.label,
    icon: !isDay && c.nightIcon ? c.nightIcon : c.icon,
    tone: !isDay && c.nightIcon ? nightTone : c.tone,
  }
}

export function convertTemp(celsius: number, unit: Unit) {
  return unit === "c" ? celsius : (celsius * 9) / 5 + 32
}

export function formatTemp(celsius: number, unit: Unit) {
  return `${Math.round(convertTemp(celsius, unit))}°`
}

// Open-Meteo는 timezone=auto일 때 지역 현지 시각 문자열(오프셋 없음)을 준다.
// 브라우저 타임존 영향을 받지 않도록 문자열에서 직접 파싱한다.
export function hourOf(isoLocal: string) {
  return Number(isoLocal.slice(11, 13))
}

export function formatHour(isoLocal: string) {
  const h = hourOf(isoLocal)
  const period = h < 12 ? "오전" : "오후"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${period} ${h12}시`
}

export function formatClock(isoLocal: string) {
  return isoLocal.slice(11, 16)
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

export function formatMonthDay(date: string) {
  const [, m, d] = date.split("-").map(Number)
  return `${m}/${d}`
}

export function minutesOfDay(isoLocal: string) {
  return hourOf(isoLocal) * 60 + Number(isoLocal.slice(14, 16))
}

export function windDirectionLabel(deg: number) {
  const dirs = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"]
  return dirs[Math.round(deg / 45) % 8]
}

export function uvLevel(uv: number) {
  if (uv < 3) return "낮음"
  if (uv < 6) return "보통"
  if (uv < 8) return "높음"
  if (uv < 11) return "매우 높음"
  return "위험"
}

export function cityLabel(city: City) {
  return [city.admin1 && city.admin1 !== city.name ? city.admin1 : null, city.country]
    .filter(Boolean)
    .join(", ")
}

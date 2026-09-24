"use client"

import * as React from "react"

import { getBackgroundName } from "@/lib/weather"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(onChange: () => void) {
  const mql = matchMedia(REDUCED_MOTION)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(REDUCED_MOTION).matches,
    () => false
  )
}

export function WeatherBackground({ code, isDay }: { code: number; isDay: boolean }) {
  const reducedMotion = usePrefersReducedMotion()
  const name = getBackgroundName(code, isDay)
  const poster = `/videos/weather/${name}.jpg`

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* 장면이 바뀌면 key로 새로 마운트해 페이드인한다. 모션 줄이기 설정이면 정지 이미지만 보여준다. */}
      <div key={name} className="absolute inset-0 animate-in duration-1000 fade-in">
        {reducedMotion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="size-full object-cover" />
        ) : (
          <video
            src={`/videos/weather/${name}.mp4`}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="size-full object-cover"
          />
        )}
      </div>
      {/* 텍스트 가독성을 위한 스크림 */}
      <div className="absolute inset-0 bg-linear-to-b from-background/50 via-background/25 to-background/60 dark:from-background/70 dark:via-background/45 dark:to-background/75" />
    </div>
  )
}

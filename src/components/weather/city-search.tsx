"use client"

import * as React from "react"
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type City, POPULAR_CITIES, cityLabel, searchCities } from "@/lib/weather"

type Props = {
  city: City
  onSelect: (city: City) => void
}

export function CitySearch({ city, onSelect }: Props) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [found, setFound] = React.useState<{ query: string; cities: City[] } | null>(null)
  const [locating, setLocating] = React.useState(false)

  const q = query.trim()
  const searching = q.length >= 2
  const results = found?.query === q ? found.cities : []
  const loading = searching && found?.query !== q

  React.useEffect(() => {
    if (!searching) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchCities(q, controller.signal)
        .then((cities) => setFound({ query: q, cities }))
        .catch((e: Error) => {
          if (e.name !== "AbortError") setFound({ query: q, cities: [] })
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q, searching])

  function choose(next: City) {
    onSelect(next)
    setOpen(false)
    setQuery("")
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        choose({
          id: "current-location",
          name: "현재 위치",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  const list = searching ? results : POPULAR_CITIES

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground sm:w-72"
          aria-label="도시 변경"
        >
          <Search className="size-4" />
          <span className="truncate">도시 검색…</span>
          <span className="ml-auto flex items-center gap-1 truncate text-foreground">
            <MapPin className="size-3.5 text-primary" />
            {city.name}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="도시 이름을 입력하세요 (예: 수원, Paris)"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> 검색 중…
              </div>
            ) : searching && results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </p>
            ) : null}
            {!loading && list.length > 0 && (
              <>
                <CommandGroup>
                  <CommandItem onSelect={useMyLocation} disabled={locating}>
                    {locating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LocateFixed className="size-4 text-primary" />
                    )}
                    현재 위치 사용
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading={searching ? "검색 결과" : "주요 도시"}>
                  {list.map((c) => (
                    <CommandItem
                      key={`${c.id}-${c.latitude}`}
                      value={`${c.id}`}
                      onSelect={() => choose(c)}
                    >
                      <MapPin className="size-4 text-muted-foreground" />
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {cityLabel(c)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

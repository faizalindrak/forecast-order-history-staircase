'use client'

import { useEffect, useMemo, useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SkuOption {
  id: string
  label: string
  description?: string
}

interface SkuSelectProps {
  value?: string
  options: SkuOption[]
  placeholder?: string
  onChange: (value: string) => void
  className?: string
}

export function SkuSelect({ value, options, placeholder = 'Pilih SKU', onChange, className }: SkuSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const query = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(query) || option.description?.toLowerCase().includes(query)
    )
  }, [options, search])

  const activeOption = options.find((option) => option.id === value)

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-11 w-full justify-between rounded-2xl border-none bg-white/80 px-4 text-base font-medium shadow-sm transition hover:bg-white focus-visible:ring-2 focus-visible:ring-primary/40 dark:bg-neutral-800/80 dark:text-neutral-100 dark:hover:bg-neutral-800/60 dark:focus-visible:ring-primary/60',
            className,
            !activeOption && 'text-muted-foreground'
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {activeOption ? (
                <>
                  <span className="font-semibold">{activeOption.label}</span>
                  {activeOption.description ? (
                    <span className="ml-1 text-sm text-muted-foreground">• {activeOption.description}</span>
                  ) : null}
                </>
              ) : (
                placeholder
              )}
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(360px,90vw)] p-0" align="start">
        <Command className="border-none shadow-none" shouldFilter={false}>
          <CommandInput
            placeholder="Cari SKU berdasarkan part number atau nama..."
            value={search}
            onValueChange={setSearch}
            className="text-sm"
          />
          <CommandList className="max-h-64">
            <CommandEmpty>SKU tidak ditemukan</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                    value === option.id
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground/90 hover:text-foreground'
                  )}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold leading-tight">{option.label}</span>
                    {option.description ? (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    ) : null}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto size-4 text-primary transition-opacity',
                      value === option.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

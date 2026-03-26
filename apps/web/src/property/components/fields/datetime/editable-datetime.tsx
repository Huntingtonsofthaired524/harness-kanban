'use client'

import { format } from 'date-fns'
import { Clock2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { SvgIcon } from '@/components/common/svg-icon'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/shadcn/utils'
import type { RendererComponent } from '@/property/types/property-types'

export const EditableDatetime: RendererComponent<number | null> = ({ value, onChange, disabled, meta }) => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>()
  const [_time, setTime] = useState<string>('00:00')
  const [draftDate, setDraftDate] = useState<Date | undefined>()
  const [draftTime, setDraftTime] = useState<string>('00:00')
  const label = meta.display?.label

  const commit = (d?: Date, t = '00:00') => {
    if (!d) {
      onChange?.(null)
      return
    }
    const [h, m] = t.split(':').map(Number)
    if (h !== undefined && m !== undefined && !Number.isNaN(h) && !Number.isNaN(m)) {
      const newDate = new Date(d)
      newDate.setHours(h)
      newDate.setMinutes(m)
      newDate.setSeconds(0, 0)
      onChange?.(newDate.getTime())
    }
  }

  const placeholder = meta.display?.placeholder ?? 'Pick a date'

  useEffect(() => {
    const resolved = value ?? undefined
    const isValidTimestamp = typeof resolved === 'number' && !Number.isNaN(resolved)

    if (isValidTimestamp) {
      const d = new Date(resolved)
      const t = format(d, 'HH:mm')
      setDate(d)
      setTime(t)
      setDraftDate(d)
      setDraftTime(t)
    } else {
      setDate(undefined)
      setTime('00:00')
      setDraftDate(undefined)
      setDraftTime('00:00')
    }
  }, [value])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'justify-start bg-transparent text-left font-normal',
            '!w-[var(--select-options-width)]',
            'border-transparent shadow-none dark:border-none',
            'hover:border-border focus-visible:border-border hover:shadow-sm focus-visible:shadow-sm focus-visible:ring-[1px]',
            'px-3 py-2 hover:bg-transparent',
            !date && 'text-muted-foreground',
          )}>
          <span className="flex items-center gap-2">
            {date ? (
              <>
                <SvgIcon src="/images/datetime.svg" alt="Resolved At" width={16} height={16} className="dark:invert" />
                {format(date, 'yyyy-MM-dd')}
              </>
            ) : (
              <>
                {meta?.display?.placeholderIcon}
                <span>{placeholder}</span>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 pb-2" align="start">
        {label && <div className="text-muted-foreground select-none px-2 py-1 text-xs font-medium">Change {label}</div>}
        <Calendar
          mode="single"
          selected={draftDate}
          onSelect={setDraftDate}
          initialFocus
          disabled={{ after: new Date() }}
        />
        <div className="w-full border-t px-3 py-2">
          <Label htmlFor="time-picker" className="text-muted-foreground mb-2 block text-sm font-medium">
            Time
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="time-picker"
                type="time"
                step="60"
                value={draftTime}
                onChange={e => setDraftTime(e.target.value)}
                disabled={!draftDate}
                className="h-9 pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between gap-2 px-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDraftDate(undefined)
              setDraftTime('00:00')
              commit(undefined)
              setOpen(false)
            }}>
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => {
              commit(draftDate, draftTime)
              setOpen(false)
            }}>
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

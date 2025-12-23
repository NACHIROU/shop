"use client"

import * as React from "react"
import { addDays, format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    placeholder?: string
    className?: string
}

export function DateRangePicker({
    date,
    setDate,
    placeholder = "Sélectionner une date",
    className,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const presets = [
        {
            label: "Aujourd'hui",
            getValue: () => ({ from: new Date(), to: new Date() }),
        },
        {
            label: "Hier",
            getValue: () => {
                const yesterday = subDays(new Date(), 1)
                return { from: yesterday, to: yesterday }
            },
        },
        {
            label: "7 derniers jours",
            getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
        },
        {
            label: "Ce mois-ci",
            getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
        },
        {
            label: "Mois dernier",
            getValue: () => {
                const lastMonth = subMonths(new Date(), 1)
                return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
            },
        },
    ]

    const handlePresetClick = (preset: { getValue: () => DateRange }) => {
        setDate(preset.getValue())
        setIsOpen(false)
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "d LLL y", { locale: fr })} -{" "}
                                    {format(date.to, "d LLL y", { locale: fr })}
                                </>
                            ) : (
                                format(date.from, "d LLL y", { locale: fr })
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="border-r p-2 flex flex-col gap-1 w-[140px]">
                            <p className="text-xs text-muted-foreground font-medium mb-2 px-2 pt-2">Raccourcis</p>
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs font-normal"
                                    onClick={() => handlePresetClick(preset)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        <div className="p-0">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={fr}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {date && (
                <Button variant="ghost" size="icon" onClick={() => setDate(undefined)}>
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}

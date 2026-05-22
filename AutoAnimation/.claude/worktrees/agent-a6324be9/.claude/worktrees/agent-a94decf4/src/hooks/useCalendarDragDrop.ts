/**
 * useCalendarDragDrop — HTML5 drag-and-drop hook for calendar scheduling.
 * Handles dragging scheduled clips between calendar day cells.
 */

import { useState, useCallback, useRef } from 'react'

export interface CalendarDragData {
  /** Execution or schedule ID being dragged */
  id: string
  /** Original date (ISO string) */
  sourceDate: string
}

interface UseCalendarDragDropReturn {
  /** Currently dragged item data */
  dragData: CalendarDragData | null
  /** ID of the day cell being hovered over */
  dropTargetDate: string | null
  /** Start dragging an item */
  handleDragStart: (e: React.DragEvent, data: CalendarDragData) => void
  /** Handle drag entering a day cell */
  handleDragOver: (e: React.DragEvent, date: string) => void
  /** Handle drag leaving a day cell */
  handleDragLeave: () => void
  /** Handle dropping on a day cell */
  handleDrop: (e: React.DragEvent, targetDate: string) => CalendarDragData | null
  /** Cancel drag */
  handleDragEnd: () => void
}

export function useCalendarDragDrop(): UseCalendarDragDropReturn {
  const [dragData, setDragData] = useState<CalendarDragData | null>(null)
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null)
  const dragDataRef = useRef<CalendarDragData | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, data: CalendarDragData) => {
    setDragData(data)
    dragDataRef.current = data
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(data))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, date: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetDate(date)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropTargetDate(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetDate: string): CalendarDragData | null => {
    e.preventDefault()
    setDropTargetDate(null)

    const data = dragDataRef.current
    if (!data) return null

    // Don't drop on the same date
    if (data.sourceDate === targetDate) {
      setDragData(null)
      dragDataRef.current = null
      return null
    }

    setDragData(null)
    dragDataRef.current = null
    return data
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragData(null)
    setDropTargetDate(null)
    dragDataRef.current = null
  }, [])

  return {
    dragData,
    dropTargetDate,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}

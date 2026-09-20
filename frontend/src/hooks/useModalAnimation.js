import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useModalAnimation — Custom hook providing smooth popping enter and exit animations for modals.
 *
 * @param {boolean} isOpen - Controlled open state from parent.
 * @param {function} onClose - Parent callback to close the modal.
 * @param {number} exitDuration - Duration in ms for the exit pop-out animation (default: 200ms).
 */
export function useModalAnimation(isOpen, onClose, exitDuration = 200) {
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)
  const timerRef = useRef(null)
  const prevIsOpenRef = useRef(isOpen)

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    prevIsOpenRef.current = isOpen

    if (!wasOpen && isOpen) {
      // Transitioned from closed -> open
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsRendered(true)
      setIsExiting(false)
    } else if (wasOpen && !isOpen) {
      // Transitioned from open -> closed externally by parent
      if (!isExiting) {
        setIsExiting(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setIsRendered(false)
          setIsExiting(false)
        }, exitDuration)
      }
    }
  }, [isOpen, isExiting, exitDuration])

  // Cleanup any lingering timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const triggerClose = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsRendered(false)
      setIsExiting(false)
      onClose?.()
    }, exitDuration)
  }, [isExiting, onClose, exitDuration])

  return {
    isMounted: isOpen || isRendered,
    isExiting,
    triggerClose,
  }
}

export default useModalAnimation

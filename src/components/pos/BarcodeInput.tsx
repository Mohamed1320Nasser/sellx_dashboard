import React, { useRef, useEffect, useState } from 'react'
import { Scan, CheckCircle } from 'lucide-react'

interface BarcodeInputProps {
  value: string
  onChange: (value: string) => void
  onScan?: (barcode: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  autoFocus?: boolean
}

export function BarcodeInput({
  value,
  onChange,
  onScan,
  placeholder = "Scan or enter barcode...",
  disabled = false,
  className = "",
  autoFocus = false
}: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastKeyTime, setLastKeyTime] = useState<number>(0)
  const [scanDetected, setScanDetected] = useState<boolean>(false)
  const [isScannerInput, setIsScannerInput] = useState<boolean>(false)
  const scanBufferRef = useRef<string>('')
  const scanTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Scanner detection logic
  // Barcode scanners typically send keystrokes very fast (<50ms between characters)
  // followed by Enter key. This differentiates scanner from manual keyboard input.
  const handleKeyPress = (e: React.KeyboardEvent) => {
    const now = Date.now()
    const timeDiff = now - lastKeyTime

    // If time between keypresses is < 50ms, likely a scanner
    if (timeDiff < 50 && timeDiff > 0) {
      setIsScannerInput(true)
    } else if (timeDiff > 200) {
      // Reset if typing is slow (manual keyboard input)
      setIsScannerInput(false)
      scanBufferRef.current = ''
    }

    setLastKeyTime(now)

    // Build scan buffer for scanner input
    if (isScannerInput && e.key.length === 1) {
      scanBufferRef.current += e.key
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      if (value.trim()) {
        // Determine if this was a scanner or manual input
        const wasScanner = isScannerInput || scanBufferRef.current.length > 0

        if (wasScanner) {
          // Scanner detected - show visual feedback
          setScanDetected(true)

          // Play success sound (optional)
          playBeep()

          // Clear scan animation after 1 second
          setTimeout(() => setScanDetected(false), 1000)
        }

        // Trigger scan callback
        if (onScan) {
          onScan(value.trim())
        }

        // Reset scanner state
        setIsScannerInput(false)
        scanBufferRef.current = ''
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)

    // Auto-clear scan detection after typing stops for 500ms
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }
    scanTimeoutRef.current = setTimeout(() => {
      setIsScannerInput(false)
      scanBufferRef.current = ''
    }, 500)
  }

  // Optional: Play beep sound on successful scan
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // 800 Hz beep
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Ignore audio errors (browser may block autoplay)
      console.debug('Audio feedback not available')
    }
  }

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Scan Icon - shows scanner is active */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {scanDetected ? (
            <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />
          ) : (
            <Scan className={`w-5 h-5 ${isScannerInput ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-11 pr-4 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-all duration-200
            ${scanDetected
              ? 'border-green-500 ring-2 ring-green-200 bg-green-50'
              : isScannerInput
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-300 focus:ring-blue-500'
            }
          `}
        />

        {/* Scanner status indicator */}
        {isScannerInput && !scanDetected && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs text-blue-600 font-medium">Scanning...</span>
            </div>
          </div>
        )}

        {/* Success indicator */}
        {scanDetected && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-600 font-medium">✓ Scanned</span>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      {!disabled && !value && (
        <p className="text-xs text-gray-500 mt-1">
          Use barcode scanner or type manually and press Enter
        </p>
      )}
    </div>
  )
}

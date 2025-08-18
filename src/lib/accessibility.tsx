// Accessibility utilities and helpers
import React from 'react'

export interface AccessibilityProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-atomic'?: boolean
  'aria-busy'?: boolean
  'aria-controls'?: string
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  'aria-disabled'?: boolean
  'aria-invalid'?: boolean | 'grammar' | 'spelling'
  'aria-required'?: boolean
  'aria-selected'?: boolean
  'aria-checked'?: boolean | 'mixed'
  role?: string
  tabIndex?: number
}

// Generate unique IDs for accessibility
let idCounter = 0
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`
}

// Keyboard navigation utilities
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
} as const

export type KeyboardKey = typeof KeyboardKeys[keyof typeof KeyboardKeys]

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
  }

  static getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    return elements[0] || null
  }

  static getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    return elements[elements.length - 1] || null
  }

  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== KeyboardKeys.TAB) return

    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  static restoreFocus(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  static createLiveRegion(id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
    let region = document.getElementById(id)
    
    if (!region) {
      region = document.createElement('div')
      region.id = id
      region.setAttribute('aria-live', priority)
      region.setAttribute('aria-atomic', 'true')
      region.className = 'sr-only'
      document.body.appendChild(region)
    }

    return region
  }

  static updateLiveRegion(id: string, message: string): void {
    const region = document.getElementById(id)
    if (region) {
      region.textContent = message
    }
  }
}

// Color contrast utilities
export class ColorContrastUtils {
  // Calculate relative luminance
  static getRelativeLuminance(color: string): number {
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  // Calculate contrast ratio between two colors
  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(color1)
    const l2 = this.getRelativeLuminance(color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  // Check if contrast meets WCAG AA standards
  static meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background)
    return isLargeText ? ratio >= 3 : ratio >= 4.5
  }

  // Check if contrast meets WCAG AAA standards
  static meetsWCAGAAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background)
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}

// Accessible form utilities
export class AccessibleFormUtils {
  static generateFieldIds(fieldName: string) {
    const baseId = generateId(fieldName)
    return {
      field: baseId,
      label: `${baseId}-label`,
      error: `${baseId}-error`,
      help: `${baseId}-help`
    }
  }

  static getAriaDescribedBy(errorId?: string, helpId?: string): string | undefined {
    const ids = [errorId, helpId].filter(Boolean)
    return ids.length > 0 ? ids.join(' ') : undefined
  }
}

// Keyboard navigation hooks and utilities
export function useKeyboardNavigation(
  items: any[],
  onSelect?: (item: any, index: number) => void,
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  const handleKeyDown = (event: KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex

    switch (event.key) {
      case KeyboardKeys.ARROW_UP:
        if (orientation === 'vertical') {
          event.preventDefault()
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        }
        break
      case KeyboardKeys.ARROW_DOWN:
        if (orientation === 'vertical') {
          event.preventDefault()
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        }
        break
      case KeyboardKeys.ARROW_LEFT:
        if (orientation === 'horizontal') {
          event.preventDefault()
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        }
        break
      case KeyboardKeys.ARROW_RIGHT:
        if (orientation === 'horizontal') {
          event.preventDefault()
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        }
        break
      case KeyboardKeys.HOME:
        event.preventDefault()
        newIndex = 0
        break
      case KeyboardKeys.END:
        event.preventDefault()
        newIndex = items.length - 1
        break
      case KeyboardKeys.ENTER:
      case KeyboardKeys.SPACE:
        if (onSelect) {
          event.preventDefault()
          onSelect(items[currentIndex], currentIndex)
        }
        break
    }

    return newIndex
  }

  return { handleKeyDown }
}

// Skip link component for keyboard navigation
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </a>
  )
}

// Accessible status indicators
export const AccessibleStatus = {
  success: {
    'aria-label': 'Success',
    role: 'status',
    'aria-live': 'polite' as const
  },
  error: {
    'aria-label': 'Error',
    role: 'alert',
    'aria-live': 'assertive' as const
  },
  warning: {
    'aria-label': 'Warning',
    role: 'status',
    'aria-live': 'polite' as const
  },
  info: {
    'aria-label': 'Information',
    role: 'status',
    'aria-live': 'polite' as const
  }
}

// Reduced motion utilities
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

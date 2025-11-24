"use client"

import { useEffect } from "react"

export function HideIcons() {
  useEffect(() => {
    function hideCircularIcons() {
      // Find ALL elements on the page
      const allElements = document.querySelectorAll("*")
      
      allElements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return
        
        const classes = el.className?.toString() || ""
        const style = el.getAttribute("style") || ""
        const text = el.textContent?.trim() || ""
        const computedStyle = window.getComputedStyle(el)
        
        // Get position and dimensions
        const position = computedStyle.position
        const bottom = computedStyle.bottom
        const left = computedStyle.left
        const borderRadius = computedStyle.borderRadius
        const width = computedStyle.width
        const height = computedStyle.height
        
        // Check if it's circular (border-radius 50% or equal width/height with high border-radius)
        const isCircular = borderRadius === "50%" || 
                          borderRadius.includes("50%") ||
                          (width === height && parseFloat(borderRadius) > parseFloat(width) * 0.4) ||
                          classes.includes("rounded-full")
        
        // Check if it's in bottom-left corner
        const isBottomLeft = (position === "fixed" || position === "absolute") &&
                           (bottom !== "auto" && parseFloat(bottom) < 100) &&
                           (left !== "auto" && parseFloat(left) < 100)
        
        // Check if it contains single letter (especially "N")
        const isSingleLetter = text.length === 1 && /[A-Z]/.test(text)
        const isLetterN = text === "N"
        
        // Check for background colors
        const hasBg = classes.includes("bg-gray") || 
                     classes.includes("bg-green") ||
                     classes.includes("bg-") ||
                     computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" ||
                     style.includes("background")
        
        // AGGRESSIVE REMOVAL: Remove if ANY of these conditions match
        if (isCircular && (hasBg || isSingleLetter || isLetterN || isBottomLeft)) {
          el.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;"
          try {
            el.remove()
          } catch (e) {
            // If remove fails, try parent
            if (el.parentElement) {
              el.parentElement.removeChild(el)
            }
          }
        }
        
        // Also remove ANY element with "N" in bottom-left, regardless of shape
        if (isLetterN && isBottomLeft) {
          el.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;"
          try {
            el.remove()
          } catch (e) {
            if (el.parentElement) {
              el.parentElement.removeChild(el)
            }
          }
        }
        
        // Remove any element that looks like a circular icon in bottom-left
        if (isCircular && isBottomLeft && (isSingleLetter || hasBg)) {
          el.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;"
          try {
            el.remove()
          } catch (e) {
            if (el.parentElement) {
              el.parentElement.removeChild(el)
            }
          }
        }
      })
    }

    // Run immediately when component mounts
    if (typeof window !== "undefined") {
      hideCircularIcons()
      
      // Run on DOMContentLoaded
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", hideCircularIcons)
      } else {
        hideCircularIcons()
      }
      
      // Run on load
      window.addEventListener("load", hideCircularIcons)
      
      // Run multiple times with increasing delays
      const timeouts = []
      for (let i = 0; i <= 20; i++) {
        timeouts.push(setTimeout(hideCircularIcons, i * 100))
      }
      
      // Use MutationObserver with aggressive settings
      const observer = new MutationObserver(() => {
        hideCircularIcons()
      })
      
      if (document.body) {
        observer.observe(document.body, { 
          childList: true, 
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style'],
          characterData: true
        })
      }
      
      // Also observe document
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true
      })
      
      // Set up interval as backup
      const interval = setInterval(hideCircularIcons, 500)
      
      return () => {
        timeouts.forEach(clearTimeout)
        clearInterval(interval)
        observer.disconnect()
        document.removeEventListener("DOMContentLoaded", hideCircularIcons)
        window.removeEventListener("load", hideCircularIcons)
      }
    }
  }, [])

  return null
}


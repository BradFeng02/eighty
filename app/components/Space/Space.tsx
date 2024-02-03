'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Space.module.css'
import { SPACE_ZOOM_RATE, PAN_SLOW_THRESH } from '@/app/constants'
import { clamp } from '@/app/utils'

const Space = () => {
  const mouseTarget = useRef<HTMLDivElement>(null)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [mouseMove, setMouseMove] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(false)
  const [panDiff, setPanDiff] = useState([0, 0, 0]) // dx, dy, diff

  const wheelHandler = (e: WheelEvent) => {
    // some browsers not pixel
    let d = e.deltaY
    if (e.deltaMode) {
      if (e.deltaMode == 1) d *= 40
      else d *= 800
    }

    // zoom
    if (e.ctrlKey) {
      let factor = 1
      if (Math.abs(e.deltaY) >= 100) {
        // wheel + ctrl
        // ASSUMES pixel delta >= 100
        factor = 1 - e.deltaY / SPACE_ZOOM_RATE
      } else {
        // trackpad pinch zoom
        factor = 1 - e.deltaY / 100.0
      }
      setZoom((cz) => clamp(cz * factor, 0.5, 3))
    }

    // pan
    else {
      // adjust for scroll wheel too fast
      const dxslow =
        (Math.sqrt(Math.abs(e.deltaX) - (PAN_SLOW_THRESH - 1)) +
          PAN_SLOW_THRESH -
          1) *
          (e.deltaX < 0 ? -1 : 1) || e.deltaX
      const dyslow =
        (Math.sqrt(Math.abs(e.deltaY) - (PAN_SLOW_THRESH - 1)) +
          PAN_SLOW_THRESH -
          1) *
          (e.deltaY < 0 ? -1 : 1) || e.deltaY
      setTranslate(({ x, y }) => ({ x: x - dxslow, y: y - dyslow }))
    }

    setPanDiff(([magx, magy, _]) => [
      Math.abs(e.deltaX),
      Math.abs(e.deltaY),
      Math.abs(Math.abs(e.deltaX) - magx) + Math.abs(Math.abs(e.deltaY) - magy),
    ])

    e.stopPropagation()
    e.preventDefault()
  }

  const mouseMoveHandler = (e: MouseEvent) => {
    if (e.buttons === 1)
      setMouseMove(({ x, y }) => ({ x: x + e.movementX, y: y + e.movementY }))
    else if (e.buttons === 0) setDrag(false) // mouse up
  }

  // mouse drag
  useEffect(() => {
    if (drag && (mouseMove.x || mouseMove.y)) {
      setTranslate(({ x, y }) => ({ x: x + mouseMove.x, y: y + mouseMove.y }))
      setMouseMove({ x: 0, y: 0 })
    } else if (!drag) {
      document.body.classList.remove('nodrag')
    }
  }, [drag, mouseMove])

  // mount & unmount
  useEffect(() => {
    //// mount

    // bind event listeners
    const c_mouseTarget = mouseTarget.current

    c_mouseTarget?.addEventListener('wheel', wheelHandler, {
      passive: false,
    })
    window.addEventListener('mousemove', mouseMoveHandler, {
      passive: false,
    })

    setTranslate({ x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 })

    //// unmount
    return () => {
      c_mouseTarget?.removeEventListener('wheel', wheelHandler)
      window.removeEventListener('mousemove', mouseMoveHandler)
    }
  }, [])

  return (
    <div
      className="h-full w-full overflow-clip bg-slate-500"
      ref={mouseTarget}
      onMouseDown={(e) => {
        setMouseMove({ x: 0, y: 0 })
        setDrag(true)
        document.body.classList.add('nodrag')
      }}
    >
      <div
        className={`${styles.checker} ease-out`}
        style={{
          width: '400px',
          height: '250px',
          scale: zoom,
          translate: `${translate.x}px ${translate.y}px`,
          transitionProperty:
            !drag &&
            (panDiff[2] === 0 || (panDiff[2] >= 100 && panDiff[2] % 10 === 0))
              ? 'scale, translate'
              : 'none',
          transitionDuration: panDiff[2] === 0 ? '200ms' : '100ms',
        }}
      ></div>
    </div>
  )
}

export default Space

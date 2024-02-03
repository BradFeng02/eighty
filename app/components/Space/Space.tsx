'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Space.module.css'
import { SPACE_ZOOM_RATE, PAN_SLOW, WHEEL_PX_THRESH } from '@/app/constants'
import { clamp } from '@/app/utils'

const Space = () => {
  const mouseTarget = useRef<HTMLDivElement>(null)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [mouseMove, setMouseMove] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(false)
  const [smooth, setSmooth] = useState(false)

  const wheelHandler = (e: WheelEvent) => {
    // some browsers not pixel
    let dx = e.deltaX
    let dy = e.deltaY
    if (e.deltaMode) {
      if (e.deltaMode == 1) {
        dx *= 40
        dy *= 40
      } else {
        dx *= 800
        dy *= 800
      }
    }
    const magdx = Math.abs(dx)
    const magdy = Math.abs(dy)

    // smooth if one axis is wheel scroll, other 0
    const wheelSmooth =
      (magdx >= WHEEL_PX_THRESH && magdy === 0) ||
      (magdy >= WHEEL_PX_THRESH && magdx === 0)
    setSmooth(wheelSmooth)

    // zoom
    if (e.ctrlKey) {
      let factor = 1
      if (magdy >= WHEEL_PX_THRESH) {
        // wheel + ctrl
        // ASSUMES pixel delta >= WHEEL_PX_THRESH
        factor = 1 - dy / SPACE_ZOOM_RATE
      } else {
        // trackpad pinch zoom
        factor = 1 - dy / 100.0
      }
      setZoom((z) => clamp(z * factor, 0.5, 3))
    }

    // pan
    else {
      // adjust for scroll wheel too fast
      setTranslate(({ x, y }) => ({
        x: x - (wheelSmooth ? PAN_SLOW * Math.sign(dx) : dx),
        y: y - (wheelSmooth ? PAN_SLOW * Math.sign(dy) : dy),
      }))
    }

    e.stopPropagation()
    e.preventDefault()
  }

  const mouseMoveHandler = (e: MouseEvent) => {
    if (e.buttons === 1)
      setMouseMove(({ x, y }) => ({ x: x + e.movementX, y: y + e.movementY }))
    else if (e.buttons === 0) {
      // mouse up
      setDrag(false)
    }
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
          transitionProperty: !drag && smooth ? 'scale, translate' : 'none',
          transitionDuration: '150ms',
        }}
      >
        <p>test stuff {`${smooth}`}</p>
        <textarea>edit me?</textarea>
        <button>press me.</button>
      </div>
    </div>
  )
}

export default Space

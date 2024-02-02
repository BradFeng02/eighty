'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Space.module.css'
import { SPACE_ZOOM_RATE } from '../../constants'

const Space = () => {
  const mouseTarget = useRef<HTMLDivElement>(null)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [mouseMove, setMouseMove] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(false)

  const wheelZoomHandler = (e: WheelEvent) => {
    let d = e.deltaY
    if (e.deltaMode) {
      if (e.deltaMode == 1) d *= 40
      else d *= 800
    }
    const factor = 1 - d / SPACE_ZOOM_RATE
    setZoom((cz) => cz * factor)

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

    c_mouseTarget?.addEventListener('wheel', wheelZoomHandler, {
      passive: false,
    })
    window.addEventListener('mousemove', mouseMoveHandler, {
      passive: false,
    })

    setTranslate({ x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 })

    //// unmount
    return () => {
      c_mouseTarget?.removeEventListener('wheel', wheelZoomHandler)
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
        className={`${styles.checker}`}
        style={{
          width: '400px',
          height: '250px',
          scale: zoom,
          translate: `${translate.x}px ${translate.y}px`,
        }}
      ></div>
    </div>
  )
}

export default Space

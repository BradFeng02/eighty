import { SPACE_ZOOM_RATE, WHEEL_PX_THRESH } from '@/app/constants'
import { Point2, clamp, point2 } from '@/app/utils'
import { RefObject } from 'react'

export default class PanZoomController {
  readonly mouseTarget: HTMLDivElement
  readonly node: HTMLDivElement
  translate = point2(0, 0)
  scale = 1
  drag = false

  constructor(
    mouseTarget: RefObject<HTMLDivElement>,
    node: RefObject<HTMLDivElement>
  ) {
    if (!mouseTarget.current) throw new Error('mouse target was not mounted?')
    if (!node.current) throw new Error('pan zoom node was not mounted?')
    this.mouseTarget = mouseTarget.current
    this.node = node.current
  }

  readonly registerListeners = () => {
    this.mouseTarget.addEventListener('wheel', this.wheelHandler, {
      passive: false,
    })
    this.mouseTarget.addEventListener('mousedown', this.mouseDownHandler, {
      passive: false,
    })
  }

  readonly destroy = () => {
    this.mouseTarget.removeEventListener('wheel', this.wheelHandler)
    this.mouseTarget.removeEventListener('mousedown', this.mouseDownHandler)
  }

  // handlers

  private mouseDownHandler = (e: MouseEvent) => {
    this.setDragging(true)
    window.addEventListener('mousemove', this.mouseMoveDragHandler)
    window.addEventListener(
      'mouseup',
      (e) => {
        this.setDragging(false)
        e.stopPropagation()
        e.preventDefault()
      },
      { once: true }
    )
    e.stopPropagation()
    e.preventDefault()
  }

  private mouseMoveDragHandler = (e: MouseEvent) => {
    if (e.buttons === 1) this.translateNode(e.movementX, e.movementY)
  }

  private wheelHandler = (e: WheelEvent) => {
    const dx = normalizeWheelDelta(e.deltaX, e.deltaMode)
    const dy = normalizeWheelDelta(e.deltaY, e.deltaMode)

    // zoom
    if (e.ctrlKey) {
      let factor = 1
      if (Math.abs(dy) >= WHEEL_PX_THRESH) {
        // wheel + ctrl
        // ASSUMES pixel delta >= WHEEL_PX_THRESH
        factor = 1 - dy / SPACE_ZOOM_RATE
      } else {
        // trackpad pinch zoom
        factor = 1 - dy / 100.0
      }
      this.scaleNode(factor)
    }

    // pan
    else {
      this.translateNode(-dx, -dy)
    }

    e.stopPropagation()
    e.preventDefault()
  }

  // utils

  private translateElementCSS = (translate: Point2) => {
    this.node.style.translate = `${translate.x}px ${translate.y}px`
  }

  private scaleElementCSS = (scale: number) => {
    this.node.style.scale = scale.toString()
  }

  private translateNode = (dx: number, dy: number) => {
    this.translate.x = this.translate.x + dx
    this.translate.y = this.translate.y + dy
    this.translateElementCSS(this.translate)
  }

  private scaleNode = (factor: number) => {
    this.scale = clamp(this.scale * factor, 0.5, 3)
    this.scaleElementCSS(this.scale)
  }

  private setDragging = (dragging: boolean) => {
    if (dragging) {
      this.drag = true
      document.body.classList.add('nodrag')
      this.node.style.transitionProperty = 'none'
    } else {
      this.drag = false
      document.body.classList.remove('nodrag')
      this.node.style.transitionProperty = 'scale, translate'
    }
  }
}

// utils

const normalizeWheelDelta = (delta: number, mode: number) => {
  // some browsers wheel not pixel
  let d = delta
  if (mode) {
    if (mode == 1) {
      d *= 40
    } else {
      d *= 800
    }
  }
  return d
}

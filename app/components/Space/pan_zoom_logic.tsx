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

  /*****
   *****    PUBLIC METHODS
   *****/

  readonly registerListeners = () => {
    this.mouseTarget.addEventListener('wheel', this.wheelHandler, {
      passive: false,
    })
    // this.mouseTarget.addEventListener('mousedown', this.mouseDownHandler, {
    //   passive: false,
    // })
    this.mouseTarget.addEventListener('pointerdown', this.pointerDownHandler, {
      passive: false,
    })
  }

  readonly destroy = () => {
    this.mouseTarget.removeEventListener('wheel', this.wheelHandler)
    // this.mouseTarget.removeEventListener('mousedown', this.mouseDownHandler)
    this.mouseTarget.removeEventListener('pointerdown', this.pointerDownHandler)
  }

  /*****
   *****    HANDLERS
   *****/

  private pointerDownHandler = (e: PointerEvent) => {
    switch (e.pointerType) {
      case 'mouse':
        this.mouseDownHandler(e)
        break
      case 'pen':
        this.penDownHandler(e)
        break
      case 'touch':
        console.log('touch')

        break

      default:
        console.log(`unknown: ${e.pointerType}`)
    }
  }

  /*** MOUSE drag ***/

  private mouseDownHandler = (e: PointerEvent) => {
    this.setDragging(true)
    this.addDragHandlers(this.mouseDragHandler, this.mouseDragStopHandler)
    e.stopPropagation()
    e.preventDefault()
  }

  private mouseDragHandler = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.buttons === 1) {
      this.translateNode(e.movementX, e.movementY)
    }
  }

  private mouseDragStopHandler = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') {
      this.removeDragHandlers(this.mouseDragHandler, this.mouseDragStopHandler)
      this.setDragging(false)
      e.stopPropagation()
      e.preventDefault()
    }
  }

  /*** PEN drag ***/

  readonly PEN_DEADZONE = 10
  private penDownStart: Point2 | null = null

  private penDownHandler = (e: PointerEvent) => {
    this.penDownStart = point2(e.offsetX, e.offsetY)
    this.addDragHandlers(this.penDragHandler, this.penDragStopHandler)
    e.stopPropagation()
    e.preventDefault()
  }

  testmax = 0

  private penDragHandler = (e: PointerEvent) => {
    if (e.pointerType === 'pen' && e.buttons === 1) {
      if (this.penDragInDeadzone(e.offsetX, e.offsetY)) {
        // deadzone, count as tap
      } else {
        if (this.penDownStart !== null) {
          // leave deadzone
          this.translateNode(
            e.offsetX - this.penDownStart.x,
            e.offsetY - this.penDownStart.y
          )
          this.penDownStart = null
        } else {
          // dragging
          if (!this.drag) this.setDragging(true) // transition during catch up
          this.translateNode(e.movementX, e.movementY)
        }
      }
    }
  }

  private penDragStopHandler = (e: PointerEvent) => {
    if (e.pointerType === 'pen') {
      this.removeDragHandlers(this.penDragHandler, this.penDragStopHandler)
      this.setDragging(false)
      e.stopPropagation()
      e.preventDefault()
    }
  }

  private penDragInDeadzone = (offsetX: number, offsetY: number) => {
    if (this.penDownStart === null) return false
    const dx = offsetX - this.penDownStart.x
    const dy = offsetY - this.penDownStart.y
    return dx * dx + dy * dy < this.PEN_DEADZONE * this.PEN_DEADZONE
  }

  /*** WHEEL zoom and pan ***/

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

  /*****
   *****    UTILS
   *****/

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

  private addDragHandlers = (
    dragHandler: PointerEventHandler,
    dragStopHandler: PointerEventHandler
  ) => {
    window.addEventListener('pointermove', dragHandler)
    window.addEventListener('pointerup', dragStopHandler, { once: true })
    window.addEventListener('pointercancel', dragStopHandler, { once: true })
  }

  private removeDragHandlers = (
    dragHandler: PointerEventHandler,
    dragStopHandler: PointerEventHandler
  ) => {
    window.removeEventListener('pointermove', dragHandler)
    window.removeEventListener('pointerup', dragStopHandler)
    window.removeEventListener('pointercancel', dragStopHandler)
  }
}

// utils

type PointerEventHandler = (e: PointerEvent) => void

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

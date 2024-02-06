import { SPACE_ZOOM_RATE, WHEEL_PX_THRESH } from '@/app/constants'
import { Point2, clamp, point2 } from '@/app/utils'
import { RefObject } from 'react'

export default class PanZoomController {
  private readonly mouseTarget: HTMLDivElement
  private readonly node: HTMLDivElement
  private readonly TAP_DEADZONE = 10
  private readonly DOUBLE_TAP_DEADZONE = 30
  private readonly DOUBLE_TAP_MS = 500

  private nodeMid: Point2
  private mousePos = point2(0, 0)
  private translate = point2(0, 0)
  private scale = 1
  private drag = false
  private lastPointerDown: pointerEventDetails | null = null

  constructor(
    mouseTarget: RefObject<HTMLDivElement>,
    node: RefObject<HTMLDivElement>
  ) {
    if (!mouseTarget.current) throw new Error('mouse target was not mounted?')
    if (!node.current) throw new Error('pan zoom node was not mounted?')
    this.mouseTarget = mouseTarget.current
    this.node = node.current
    const nodeRect = this.node.getBoundingClientRect()
    this.nodeMid = point2(
      (nodeRect.left + nodeRect.right) / 2.0,
      (nodeRect.top + nodeRect.bottom) / 2.0
    )
  }

  /*****
   *****    PUBLIC METHODS
   *****/

  readonly registerListeners = () => {
    this.mouseTarget.addEventListener('wheel', this.wheelHandler, {
      passive: false,
    })
    this.mouseTarget.addEventListener('pointerdown', this.pointerDownHandler, {
      passive: false,
    })
    this.mouseTarget.addEventListener('mousemove', this.mouseMoveHandler, {
      passive: true,
      capture: true,
    })
  }

  readonly destroy = () => {
    this.mouseTarget.removeEventListener('wheel', this.wheelHandler)
    this.mouseTarget.removeEventListener('pointerdown', this.pointerDownHandler)
    this.mouseTarget.removeEventListener('mousemove', this.mouseMoveHandler, {
      capture: true,
    })
  }

  /*****
   *****    HANDLERS
   *****/

  private mouseMoveHandler = (e: MouseEvent) => {
    this.mousePos.x = e.clientX
    this.mousePos.y = e.clientY
  }

  private pointerDownHandler = (e: PointerEvent) => {
    let doubletap = false

    switch (e.pointerType) {
      case 'mouse':
        this.mouseDownHandler(e)
        break
      case 'pen':
        doubletap = this.catchDoubleTap('pen', e)
        if (!doubletap) this.penDownHandler(e)
        break
      case 'touch':
        if (this.touch1 === null && this.touch2 === null) {
          // maybe some second fingers register as double tap?
          doubletap = this.catchDoubleTap('touch', e)
        }
        if (!doubletap) this.touchDownHandler(e)
        break
      default:
        console.log(`unknown device: ${e.pointerType}`)
    }

    if (doubletap) this.lastPointerDown = null
    else
      this.lastPointerDown = {
        type: e.pointerType,
        time: e.timeStamp,
        clientX: e.clientX,
        clientY: e.clientY,
      }
  }

  private catchDoubleTap = (type: string, e: PointerEvent) => {
    if (
      this.lastPointerDown?.type === type && // same type
      e.timeStamp - this.lastPointerDown.time <= this.DOUBLE_TAP_MS && // time window
      (e.clientX - this.lastPointerDown.clientX) ** 2 + // same place
        (e.clientY - this.lastPointerDown.clientY) ** 2 <
        this.DOUBLE_TAP_DEADZONE ** 2
    ) {
      // reset zoom if zoomed in, scale 2 otherwise
      if (this.scale > 1)
        this.zoomOriginNode(1.0 / this.scale, point2(e.clientX, e.clientY))
      else this.zoomOriginNode(2.0 / this.scale, point2(e.clientX, e.clientY))
      return true
    }
    return false
  }

  /*** MOUSE drag ***/

  private mouseDownHandler = (e: PointerEvent) => {
    this.mousePos.x = e.clientX
    this.mousePos.y = e.clientY
    this.setDragging(true)
    this.addDragHandlers(this.mouseDragHandler, this.mouseDragStopHandler)
    e.stopPropagation()
    e.preventDefault()
  }

  private mouseDragHandler = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.buttons === 1) {
      this.translateNode(
        e.clientX - this.mousePos.x,
        e.clientY - this.mousePos.y
      )
      this.mousePos.x = e.clientX
      this.mousePos.y = e.clientY
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

  private penDownStart: Point2 | null = null
  private penPos: Point2 = point2(0, 0)

  private penDownHandler = (e: PointerEvent) => {
    this.penDownStart = point2(e.clientX, e.clientY)
    this.penPos = point2(e.clientX, e.clientY)
    this.addDragHandlers(this.penDragHandler, this.penDragStopHandler)
    e.stopPropagation()
    e.preventDefault()
  }

  private penDragHandler = (e: PointerEvent) => {
    if (e.pointerType === 'pen' && e.buttons === 1) {
      if (this.penDragInDeadzone(e.clientX, e.clientY)) {
        // deadzone, count as tap
      } else {
        if (this.penDownStart !== null) {
          // leave deadzone
          this.translateNode(
            e.clientX - this.penDownStart.x,
            e.clientY - this.penDownStart.y
          )
          this.penDownStart = null
        } else {
          // dragging
          if (!this.drag) this.setDragging(true) // transition during catch up
          this.translateNode(
            e.clientX - this.penPos.x,
            e.clientY - this.penPos.y
          )
        }
      }
      this.penPos.x = e.clientX
      this.penPos.y = e.clientY
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

  private penDragInDeadzone = (clientX: number, clientY: number) => {
    if (this.penDownStart === null) return false
    const dx = clientX - this.penDownStart.x
    const dy = clientY - this.penDownStart.y
    return dx * dx + dy * dy < this.TAP_DEADZONE ** 2
  }

  /*** TOUCH drag & pan & zoom ***/

  private touch1: number | null = null
  private touch2: number | null = null
  private touchPos1: Point2 = point2(0, 0)
  private touchPos2: Point2 = point2(0, 0)

  private touchDownHandler = (e: PointerEvent) => {
    this.trackTouches(e)
    this.setDragging(true)
    this.addDragHandlers(this.touchDragHandler, this.touchDragStopHandler)
    e.stopPropagation()
    e.preventDefault()
  }

  private touchDragHandler = (e: PointerEvent) => {
    if (e.pointerType === 'touch' && e.buttons === 1) {
      this.trackTouches(e)

      //// gestures
      // one finger drag
      if (e.pointerId === this.touch1 && this.touch2 === null) {
        this.translateNode(
          e.clientX - this.touchPos1.x,
          e.clientY - this.touchPos1.y
        )
        this.touchPos1.x = e.clientX
        this.touchPos1.y = e.clientY
      }
      // two finger zoom & pan, finger 1
      else if (e.pointerId === this.touch1) {
        this.twoFingerManip(e, this.touchPos1, this.touchPos2)
        this.touchPos1.x = e.clientX
        this.touchPos1.y = e.clientY
      }
      // two finger zoom & pan, finger 2
      else if (e.pointerId === this.touch2) {
        this.twoFingerManip(e, this.touchPos2, this.touchPos1)
        this.touchPos2.x = e.clientX
        this.touchPos2.y = e.clientY
      }
    }
  }

  private touchDragStopHandler = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      //// drop fingers
      if (e.pointerId === this.touch2) {
        // second finger
        this.touch2 = null
      } else if (e.pointerId === this.touch1) {
        // first finger
        this.touch1 = null
        if (this.touch2 !== null) {
          // second finger only left
          this.touch1 = this.touch2
          this.touch2 = null
          this.touchPos1 = point2(this.touchPos2.x, this.touchPos2.y)
        }
      }

      //// all fingers up
      if (this.touch1 === null && this.touch2 === null) {
        this.removeDragHandlers(
          this.touchDragHandler,
          this.touchDragStopHandler
        )
        this.setDragging(false)
      }

      e.stopPropagation()
      e.preventDefault()
    }
  }

  private twoFingerManip = (e: PointerEvent, a: Point2, b: Point2) => {
    const factor =
      dist(e.clientX, e.clientY, b.x, b.y) / dist(a.x, a.y, b.x, b.y)
    const touchMid = point2(
      (this.touchPos1.x + this.touchPos2.x) / 2.0,
      (this.touchPos1.y + this.touchPos2.y) / 2.0
    )
    this.zoomOriginNode(factor, touchMid)
    this.translateNode((e.clientX - a.x) / 2.0, (e.clientY - a.y) / 2.0)
  }

  private trackTouches = (e: PointerEvent) => {
    if (this.touch1 === null) {
      // first finger
      this.touch1 = e.pointerId
      this.touchPos1 = point2(e.clientX, e.clientY)
    } else if (this.touch2 === null && e.pointerId !== this.touch1) {
      // second finger
      this.touch2 = e.pointerId
      this.touchPos2 = point2(e.clientX, e.clientY)
    }
  }

  /*** WHEEL zoom & pan ***/

  private wheelHandler = (e: WheelEvent) => {
    const dx = normalizeWheelDelta(e.deltaX, e.deltaMode)
    const dy = normalizeWheelDelta(e.deltaY, e.deltaMode)

    // zoom
    if (e.ctrlKey) {
      let factor = 1
      if (Math.abs(dy) >= WHEEL_PX_THRESH) {
        // wheel + ctrl
        // ASSUMES pixel delta >= WHEEL_PX_THRESH
        factor = 1 + Math.abs(dy / SPACE_ZOOM_RATE)
      } else {
        // trackpad pinch zoom
        factor = 1 + Math.abs(dy / 100)
      }
      // this.zoomOriginNode((this.scale - dy / 100.0) / this.scale, this.mousePos)
      this.zoomOriginNode(dy < 0 ? factor : 1.0 / factor, this.mousePos)
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
    this.nodeMid.x = this.nodeMid.x + dx
    this.nodeMid.y = this.nodeMid.y + dy
    this.translateElementCSS(this.translate)
  }

  private scaleNode = (factor: number) => {
    this.scale = clamp(this.scale * factor, 0.5, 3)
    this.scaleElementCSS(this.scale)
  }

  private zoomOriginNode = (factor: number, origin: Point2) => {
    // scale
    const startScale = this.scale
    this.scaleNode(factor)
    const scaled = this.scale / startScale // may be clamped

    // translate
    this.translateNode(
      (this.nodeMid.x - origin.x) * scaled + origin.x - this.nodeMid.x,
      (this.nodeMid.y - origin.y) * scaled + origin.y - this.nodeMid.y
    )
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
    window.addEventListener('pointerup', dragStopHandler)
    window.addEventListener('pointercancel', dragStopHandler)
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
type pointerEventDetails = {
  type: string
  time: number
  clientX: number
  clientY: number
}

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

const dist = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}

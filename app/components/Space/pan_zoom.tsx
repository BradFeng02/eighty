import { Point2, clamp } from '@/app/utils'
import { RefObject } from 'react'
import {
  PADDING,
  SCROLL_WINDOW_MS,
  SCROLL_STEP,
  ZOOM_STEP,
  WheelType,
  normalizeWheelDelta,
  Transition,
  setTransition,
  adjustWheel,
} from './pan_zoom_utils'

export default class PanZoomController {
  private readonly space: HTMLDivElement
  private readonly node: HTMLDivElement
  private restoreStyle: string

  private scale = 1 // set in resize
  private min_zoom = 0.5
  private max_zoom = 2 // set in resize
  private target_zoom = 1.3 // set in resize
  private zoom = 1
  private trans = new Point2(0, 0)

  private spacePos = new Point2(0, 0) // set in resize
  private spaceMid = new Point2(0, 0) // set in resize
  private nodeMid: Point2
  private spaceHalf = new Point2(0, 0) // set in resize
  private nodeHalf: Point2

  constructor(
    container: RefObject<HTMLDivElement>,
    wrapper: RefObject<HTMLDivElement>
  ) {
    if (!container.current || !wrapper.current)
      throw new Error('Space - not mounted?')
    this.space = container.current
    this.node = wrapper.current
    this.restoreStyle = this.node.style.cssText
    this.setTransition(Transition.Fast)

    const nodeRect = this.node.getBoundingClientRect() // won't change size
    this.nodeHalf = new Point2(nodeRect.width / 2.0, nodeRect.height / 2.0)
    this.resize()
    this.nodeMid = this.spaceMid.clone() // starts already centered

    this.registerListeners()
  }

  readonly destroy = () => {
    this.removeListeners()
    this.node.style.cssText = this.restoreStyle
  }

  readonly resize = () => {
    const spaceRect = this.space.getBoundingClientRect()

    this.spacePos.set(spaceRect.x, spaceRect.y)
    this.spaceMid.set(
      (spaceRect.left + spaceRect.right) / 2,
      (spaceRect.top + spaceRect.bottom) / 2
    )
    this.spaceHalf.set(spaceRect.width / 2, spaceRect.height / 2)

    this.scale = Math.min(
      (spaceRect.width - PADDING * 2) / (this.nodeHalf.x * 2),
      (spaceRect.height - PADDING * 2) / (this.nodeHalf.y * 2)
    )
    this.node.style.transform = `scale(${this.scale})`
    this.max_zoom = Math.max(3.0 / this.scale, 2)
    this.target_zoom = Math.max(2.0 / this.scale, 1.3)
  }

  /*****
   *****    HANDLERS
   *****/

  private registerListeners = () => {
    this.space.addEventListener('wheel', this.wheelHandler, {
      passive: false,
    })
    this.space.addEventListener('pointerdown', this.pointerDownHandler, {
      passive: false,
    })
  }

  private removeListeners = () => {
    this.space.removeEventListener('wheel', this.wheelHandler)
    this.space.removeEventListener('pointerdown', this.pointerDownHandler)
  }

  /*** WHEEL zoom & scroll ***/

  private lastWheelTime: number = -1000
  private lastMagX: number = -1
  private lastMagY: number = -1

  private wheelHandler = (e: WheelEvent) => {
    this.setTransition(Transition.Fast)
    const dx_px = normalizeWheelDelta(e.deltaX, e.deltaMode)
    const dy_px = normalizeWheelDelta(e.deltaY, e.deltaMode)
    const magX = Math.abs(dx_px)
    const magY = Math.abs(dy_px)
    const elapsed = e.timeStamp - this.lastWheelTime
    const [dx, wheelX] = adjustWheel(
      this.lastMagX == -1 ? 0 : dx_px, // first ever scroll, ignore
      magX,
      this.lastMagX,
      elapsed
    )
    const [dy, wheelY] = adjustWheel(
      this.lastMagY == -1 ? 0 : dy_px, // first ever scroll, ignore
      magY,
      this.lastMagY,
      elapsed
    )
    if (wheelX !== WheelType.Smooth || wheelY !== WheelType.Smooth) {
      // if is wheel or unknown
      this.lastMagX = magX
      this.lastMagY = magY
    } else {
      // if ever not wheel, disable possibility for rest of scroll
      this.lastMagX = 0.11111111111
      this.lastMagY = 0.11111111111
    }
    this.lastWheelTime = e.timeStamp

    // scroll
    if (!e.ctrlKey) {
      this.pan(-dx, -dy)
    }
    // zoom
    else if (e.ctrlKey && dy) {
      let zoomAmt = Math.abs(dy)
      if (wheelY === WheelType.Unknown) zoomAmt = clamp(zoomAmt, 0, ZOOM_STEP)
      else if (wheelY === WheelType.Wheel) zoomAmt = ZOOM_STEP
      const factor = 1 + Math.abs(zoomAmt / 100)
      this.zoomBy(dy < 0 ? factor : 1 / factor)
    }
    e.stopPropagation()
    e.preventDefault()
  }

  /*** POINTER ***/

  private pointerDownHandler = (e: PointerEvent) => {
    switch (e.pointerType) {
      case 'mouse':
        break
      case 'pen':
        break
      case 'touch':
        break
      default:
        console.warn(`unknown device: ${e.pointerType}`)
    }
  }

  /*****
   *****    UTILS
   *****/

  private pan = (dx: number, dy: number) => {
    this.trans.move(dx, dy)
    this.node.style.translate = `${this.trans.x}px ${this.trans.y}px`
  }

  private zoomBy = (factor: number) => {
    this.zoom = clamp(this.zoom * factor, this.min_zoom, this.max_zoom)
    this.node.style.scale = this.zoom.toString()
  }

  private zoomTo = (factor: number, originX: number, originY: number) => {
    1 === 1
  }

  private transition: Transition | undefined
  private setTransition = (speed: Transition) => {
    if (this.transition !== speed) {
      setTransition(this.node, speed)
      this.transition = speed
    }
  }
}

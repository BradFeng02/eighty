import { Point2, clamp, fequals } from '@/app/utils'
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
import WheelLogic from './wheel_logic'

export default class PanZoomController {
  private readonly space: HTMLDivElement
  private readonly node: HTMLDivElement
  private restoreStyle: string

  private wheelLogic: WheelLogic

  private onViewIsResetChange: (val: boolean) => void

  private scale = 1 // set in resize
  private min_zoom = 0.5
  private max_zoom = 2 // set in resize
  private target_zoom = 1.3 // set in resize
  private zoom = 1
  private trans = new Point2(0, 0)

  private spacePos = new Point2(0, 0) // set in resize
  private spaceMid = new Point2(0, 0) // set in resize
  private nodeMid: Point2
  private spaceQuarter = new Point2(0, 0) // set in resize
  private nodeHalf: Point2

  constructor(
    container: RefObject<HTMLDivElement>,
    wrapper: RefObject<HTMLDivElement>,
    onViewIsResetChange: (val: boolean) => void
  ) {
    this.onViewIsResetChange = onViewIsResetChange
    this.setViewIsReset(true)

    if (!container.current || !wrapper.current)
      throw new Error('Space - not mounted?')
    this.space = container.current
    this.node = wrapper.current
    this.restoreStyle = this.node.style.cssText
    this.setTransition(Transition.Fast)

    const nodeRect = this.node.getBoundingClientRect() // won't change size
    this.nodeHalf = new Point2(nodeRect.width / 2, nodeRect.height / 2)
    this.nodeMid = new Point2(0, 0) // will be moved in resize, must start centered
    this.resize()

    this.wheelLogic = new WheelLogic(this.pan, this.zoomTo)
    this.registerListeners()
    this.resizeObserver.observe(this.space)
  }

  readonly destroy = () => {
    this.resizeObserver.disconnect()
    this.removeListeners()
    this.node.style.cssText = this.restoreStyle
  }

  private resizeObserver = new ResizeObserver(() => this.resize())
  private resize = () => {
    const spaceRect = this.space.getBoundingClientRect()

    this.spacePos.set(spaceRect.x, spaceRect.y)
    const oldmidx = this.spaceMid.x
    const oldmidy = this.spaceMid.y
    this.spaceMid.set(
      (spaceRect.left + spaceRect.right) / 2,
      (spaceRect.top + spaceRect.bottom) / 2
    )
    this.nodeMid.move(this.spaceMid.x - oldmidx, this.spaceMid.y - oldmidy)
    this.spaceQuarter.set(spaceRect.width / 4, spaceRect.height / 4)

    const newscale = Math.min(
      (spaceRect.width - PADDING * 2) / (this.nodeHalf.x * 2),
      (spaceRect.height - PADDING * 2) / (this.nodeHalf.y * 2)
    )
    if (newscale <= 0) return // wonky when too small
    const oldscale = this.scale
    this.scale = newscale
    this.node.style.transform = `scale(${this.scale})`
    this.max_zoom = Math.max(3 / this.scale, 2)
    this.target_zoom = Math.max(2 / this.scale, 1.3)

    // if shifted or zoomed in/out, keep focus centered and size same
    if (!this.viewIsReset()) {
      this.setTransition(Transition.None)
      this.zoomBy(oldscale / this.scale)
      this.pan(0, 0) // need to stay in bounds
    }
  }

  private update = () => {
    const spaceRect = this.space.getBoundingClientRect()
    const dx = spaceRect.x - this.spacePos.x
    const dy = spaceRect.y - this.spacePos.y
    if (dx || dy) {
      this.nodeMid.move(dx, dy)
      this.spaceMid.move(dx, dy)
      this.spacePos.set(spaceRect.x, spaceRect.y)
    }
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
      capture: true,
    })
  }

  private removeListeners = () => {
    this.space.removeEventListener('wheel', this.wheelHandler)
    this.space.removeEventListener('pointerdown', this.pointerDownHandler, {
      capture: true,
    })
  }

  /*** WHEEL zoom & scroll ***/

  private wheelHandler = (e: WheelEvent) => {
    this.update()
    if (this.wheelLogic.wheel(e)) {
      this.setViewIsReset(false)
      this.setTransition(Transition.Fast)
    }
    e.stopPropagation()
    e.preventDefault()
  }

  /*** POINTER ***/

  private pointerDownHandler = (e: PointerEvent) => {
    this.update()
    switch (e.pointerType) {
      case 'mouse':
        break
      case 'pen':
        break
      case 'touch':
        this.resetView()
        break
      default:
        console.warn(`unknown device: ${e.pointerType}`)
    }
    e.preventDefault()
    e.stopPropagation()
  }

  /*****
   *****    UTILS
   *****/

  private pan = (dx: number, dy: number) => {
    const nodeHalfScaledX = this.nodeHalf.x * this.scale * this.zoom
    const nodeHalfScaledY = this.nodeHalf.y * this.scale * this.zoom
    const bx = Math.max(
      nodeHalfScaledX - this.spaceQuarter.x,
      this.spaceQuarter.x * 2 - nodeHalfScaledX - PADDING
    )
    const by = Math.max(
      nodeHalfScaledY - this.spaceQuarter.y,
      this.spaceQuarter.y * 2 - nodeHalfScaledY - PADDING
    )
    const clampdx = clamp(this.trans.x + dx, -bx, bx) - this.trans.x
    const clampdy = clamp(this.trans.y + dy, -by, by) - this.trans.y
    this.trans.move(clampdx, clampdy)
    this.nodeMid.move(clampdx, clampdy)
    this.node.style.translate = `${this.trans.x}px ${this.trans.y}px`
  }

  // function to pan to given trans
  private translateTo = (tx: number, ty: number) => {
    this.pan(tx - this.trans.x, ty - this.trans.y)
  }

  private zoomBy = (factor: number) => {
    this.zoom = clamp(this.zoom * factor, this.min_zoom, this.max_zoom)
    this.node.style.scale = this.zoom.toString()
  }

  private zoomTo = (factor: number, originX: number, originY: number) => {
    const startZoom = this.zoom
    this.zoomBy(factor)
    const zoomed = this.zoom / startZoom // may be clamped

    const dx = (zoomed - 1) * (this.nodeMid.x - originX)
    const dy = (zoomed - 1) * (this.nodeMid.y - originY)
    this.pan(dx, dy)
  }

  private resetView = () => {
    this.setViewIsReset(true)
    this.zoomBy(1 / this.zoom)
    this.translateTo(0, 0)
  }

  private _viewIsReset = true
  private viewIsReset = () => this._viewIsReset
  setViewIsReset = (val: boolean) => {
    this._viewIsReset = val
    this.onViewIsResetChange(val)
  }

  private transition: Transition | undefined
  private setTransition = (speed: Transition) => {
    if (this.transition !== speed) {
      setTransition(this.node, speed)
      this.transition = speed
    }
  }
}

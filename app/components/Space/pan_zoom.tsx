import { Point2, clamp, fequals } from '@/app/utils'
import { RefObject } from 'react'
import { PADDING, Transition, setTransition } from './pan_zoom_utils'
import WheelLogic from './wheel_logic'
import PointerLogic from './pointer_logic'

export default class PanZoomController {
  private readonly space: HTMLDivElement
  private readonly node: HTMLDivElement
  private restoreStyle: string

  private wheelLogic: WheelLogic
  private pointerLogic: PointerLogic

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

  /*****
   *****    CONTRUCTOR AND DETSTRUCTOR
   *****/

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
    this.pointerLogic = new PointerLogic(
      this.translateTo,
      this.zoomTo,
      this.setTransition
    )
    this.registerListeners()
    this.resizeObserver.observe(this.space)

    this.animate()
  }

  readonly destroy = () => {
    this.stopAnimation()
    this.resizeObserver.disconnect()
    this.removeListeners()
    this.node.style.cssText = this.restoreStyle
  }

  /*****
   *****    RESIZE AND POSITION CHANGE
   *****/

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
    this.max_zoom = Math.max(3 / this.scale, 2)
    this.target_zoom = Math.max(2 / this.scale, 1.3)

    // if shifted or zoomed in/out, keep focus centered and size same
    if (!this.viewIsReset()) {
      this.setTransition(Transition.None)
      this.zoomBy(oldscale / this.scale)
      this.pan(0, 0) // need to stay in bounds
    }

    this.animateInstant()
  }

  ///// position change
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
      passive: true,
    })
  }

  private removeListeners = () => {
    this.space.removeEventListener('wheel', this.wheelHandler)
    this.space.removeEventListener('pointerdown', this.pointerDownHandler)
  }

  private wheelHandler = (e: WheelEvent) => {
    this.update()
    if (this.wheelLogic.wheel(e)) {
      this.setViewIsReset(false)
      this.setTransition(Transition.Fast)
      this.animate()
    }
    e.stopPropagation()
    e.preventDefault()
  }

  private pointerDownHandler = (e: PointerEvent) => {
    this.update()
    this.pointerLogic.pointerDown(e, this.trans)
  }

  /*****
   *****    ANIMATION
   *****/

  private $zoom = 0 // animated values
  private $trans = new Point2(0, 0)
  private _zoom = 0 // ease start values
  private _trans = new Point2(0, 0)
  private oldZoom = 1 // store previous values
  private oldTrans = new Point2(0, 0)

  private animationRequestID = 0 // non-zero
  private easeStartTime = 0

  private animate = () => {
    // return if nothing changed
    if (this.viewSame(this.trans, this.oldTrans, this.zoom, this.oldZoom))
      return

    const time = performance.now()

    // leftover movement before restarting easing
    if (this.animationRequestID) {
      const dt = time - this.easeStartTime
      this.animateVals(dt, this._trans, this.oldTrans, this._zoom, this.oldZoom)
    }

    // restart easing with new end values
    this.easeStartTime = time
    this._zoom = this.$zoom // start at where animation left off
    this._trans.set(this.$trans.x, this.$trans.y) // start at where animation left off
    this.oldZoom = this.zoom
    this.oldTrans.set(this.trans.x, this.trans.y)

    // start animation if not running
    if (!this.animationRequestID)
      this.animationRequestID = requestAnimationFrame(this._frame)
  }

  private stopAnimation = () => {
    cancelAnimationFrame(this.animationRequestID)
    this.animationRequestID = 0
  }

  private _frame: FrameRequestCallback = (_) => {
    // stop animation if done
    if (this.viewSame(this.trans, this.$trans, this.zoom, this.$zoom)) {
      this.animationRequestID = 0
      return
    }
    this.animationRequestID = requestAnimationFrame(this._frame)
    this._animation(performance.now()) // animation frame time is wacky
  }

  private _animation = (time: number) => {
    const dt = time - this.easeStartTime
    this.animateVals(dt, this._trans, this.trans, this._zoom, this.zoom)
    this.node.style.translate = `${this.$trans.x}px ${this.$trans.y}px`
    this.node.style.scale = (this.$zoom * this.scale).toString()
  }

  private animateVals = (
    dt: number,
    transStart: Point2,
    transEnd: Point2,
    zoomStart: number,
    zoomEnd: number
  ) => {
    const ease = this.easeOutCubic(dt / 150)
    const dx = transEnd.x - transStart.x
    const dy = transEnd.y - transStart.y
    const dz = zoomEnd - zoomStart
    this.$trans.set(transStart.x + dx * ease, transStart.y + dy * ease)
    this.$zoom = zoomStart + dz * ease
  }

  private animateInstant = () => {
    this.$trans.set(this.trans.x, this.trans.y)
    this.$zoom = this.zoom
    this.node.style.translate = `${this.$trans.x}px ${this.$trans.y}px`
    this.node.style.scale = (this.$zoom * this.scale).toString()
  }

  private easeOutCubic = (t: number) => {
    return clamp(1 - (1 - t) ** 3, 0, 1)
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
  }

  private zoomBy = (factor: number) => {
    this.zoom = clamp(this.zoom * factor, this.min_zoom, this.max_zoom)
  }

  // function to pan to given trans
  private translateTo = (tx: number, ty: number) => {
    this.pan(tx - this.trans.x, ty - this.trans.y)
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
    // if (this.transition !== speed) {
    //   setTransition(this.node, speed)
    //   this.transition = speed
    // }
  }

  private viewSame = (a: Point2, b: Point2, c: number, d: number) =>
    fequals(c, d, 1000) && a.equals(b, 100000)
}

import { Point2, clamp, fequals } from '@/app/utils'
import { RefObject } from 'react'
import { Ease, PADDING, ViewState, easeValue } from './pan_zoom_utils'
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

    const nodeRect = this.node.getBoundingClientRect() // won't change size
    this.nodeHalf = new Point2(nodeRect.width / 2, nodeRect.height / 2)
    this.nodeMid = new Point2(0, 0) // will be moved in resize, must start centered
    this.resize()

    // prettier-ignore
    // interruptEaseWrapper: because logic should always interrupt
    this.pointerLogic = new PointerLogic(this.interruptEaseWrapper(() => this.trans), this.interruptEaseWrapper(this.saveView), this.setTranslate, this.zoomIn, this.resetView, this.manipView, this.setEase, this.animate, this.viewIsReset, this.setViewIsReset)
    this.wheelLogic = new WheelLogic(this.pan, this.zoomTo, this.setEase)
    this.registerListeners()
    this.resizeObserver.observe(this.space)

    this.setEase(Ease.None)
    this.animate()
  }

  readonly destroy = () => {
    this.pointerLogic.destroy()
    this.wheelLogic.destroy()
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
    this.interruptEase()
    this.update()
    if (this.wheelLogic.wheel(e)) this.animate()
    e.stopPropagation()
    e.preventDefault()
  }

  private pointerDownHandler = (e: PointerEvent) => {
    this.interruptEase()
    this.update()
    this.pointerLogic.pointerDown(e)
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

  private animationRequestID = 0 // non-zero during animation
  private easeStartTime = 0
  private _ease: Ease = Ease.Smooth
  private _easeInterruptable = false

  // interrupt ease, start from midway state
  // if interrupting, MUST call before accessing state (eg. setTranslate)
  private interruptEase = () => {
    if (this._easeInterruptable && this.animationRequestID) {
      this._easeInterruptable = false
      this.zoomBy(this.$zoom / this.zoom)
      this.setTranslate(this.$trans.x, this.$trans.y)
      this._zoom = this.$zoom
      this._trans.setTo(this.$trans)
      this.oldZoom = this.$zoom
      this.oldTrans.setTo(this.$trans)
    }
  }

  private setEase = (e: Ease) => {
    if (e !== this._ease) {
      if (this._ease === Ease.Slow) this.interruptEase()
      this._easeInterruptable = e === Ease.Slow // only slow ease interruptable
      this.restartEase()
      this._ease = e
    }
  }

  private restartEase = () => {
    const time = performance.now()
    // leftover movement before restarting easing
    if (this.animationRequestID) {
      const dt = time - this.easeStartTime
      this.animateVals(dt, this._trans, this.oldTrans, this._zoom, this.oldZoom)
    }
    // restart easing with new end values
    this.easeStartTime = time
    this._zoom = this.$zoom // start at where animation left off
    this._trans.setTo(this.$trans) // start at where animation left off
  }

  private animate = () => {
    // return if nothing changed
    if (this.viewSame(this.trans, this.oldTrans, this.zoom, this.oldZoom))
      return
    // if something changed...
    this.restartEase()
    this.oldZoom = this.zoom
    this.oldTrans.setTo(this.trans)
    // start animation if not running
    if (!this.animationRequestID)
      this.animationRequestID = requestAnimationFrame(this._frame)
  }

  private stopAnimation = () => {
    cancelAnimationFrame(this.animationRequestID)
    this.animationRequestID = 0
  }

  private _frame: FrameRequestCallback = (_) => {
    this._animation(performance.now()) // animation frame time is wacky
    // stop animation if done
    if (this.viewSame(this.trans, this.$trans, this.zoom, this.$zoom)) {
      this.animationRequestID = 0
      return
    }
    this.animationRequestID = requestAnimationFrame(this._frame)
  }

  private _animation = (time: number) => {
    const elapsed = time - this.easeStartTime
    this.animateVals(elapsed, this._trans, this.trans, this._zoom, this.zoom)
    this.node.style.translate = `${this.$trans.x}px ${this.$trans.y}px`
    this.node.style.scale = (this.$zoom * this.scale).toString()
  }

  // prettier-ignore
  private animateVals = (elapsed: number, transStart: Point2, transEnd: Point2, zoomStart: number, zoomEnd: number) => {
    const dx = transEnd.x - transStart.x
    const dy = transEnd.y - transStart.y
    const ev = easeValue(this._ease, elapsed, dx, dy, zoomStart, zoomEnd)
    this.$trans.set(transStart.x + dx * ev, transStart.y + dy * ev)
    this.$zoom = zoomStart + (zoomEnd - zoomStart) * ev
  }

  private animateInstant = () => {
    if (this.animationRequestID) return // don't interrupt running animation
    this.$trans.setTo(this.trans)
    this.$zoom = this.zoom
    this.node.style.translate = `${this.$trans.x}px ${this.$trans.y}px`
    this.node.style.scale = (this.$zoom * this.scale).toString()
  }

  /*****
   *****    UTILS
   *****/

  //// basic movement (MUST run when trans changes)
  private pan = (dx: number, dy: number) => {
    if (!dx && !dy) return
    this.interruptEase()
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
    this.setViewIsReset(false)
  }

  //// basic movement (MUST run when zoom changes)
  private zoomBy = (factor: number) => {
    if (factor === 1) return
    this.interruptEase()
    this.zoom = clamp(this.zoom * factor, this.min_zoom, this.max_zoom)
    this.setViewIsReset(false)
  }

  private setTranslate = (tx: number, ty: number) => {
    this.interruptEase()
    this.pan(tx - this.trans.x, ty - this.trans.y)
  }

  private zoomTo = (factor: number, originX: number, originY: number) => {
    this.interruptEase()
    const startZoom = this.zoom
    this.zoomBy(factor)
    const zoomed = this.zoom / startZoom // may be clamped
    this.pan(
      (zoomed - 1) * (this.nodeMid.x - originX),
      (zoomed - 1) * (this.nodeMid.y - originY)
    )
  }

  // starting with point p in view v, zoom by f and pan so p -> q
  // prettier-ignore
  private manipView = (view: ViewState, p: Point2, factor: number, qx: number, qy: number) => {
    this.interruptEase()
    this.zoomBy((factor * view.zoom) / this.zoom) // zoom to z
    const zoomed = this.zoom / view.zoom
    this.setTranslate(
      view.trans.x + qx - ((p.x - view.nodeMid.x) * zoomed + view.nodeMid.x),
      view.trans.y + qy - ((p.y - view.nodeMid.y) * zoomed + view.nodeMid.y)
    )
  }

  private zoomIn = (originX: number, originY: number) => {
    this.interruptEase()
    this.zoomTo(this.target_zoom / this.zoom, originX, originY)
    this.pan(this.spaceMid.x - originX, this.spaceMid.y - originY)
    this.setEase(Ease.Slow)
  }

  private resetView = () => {
    this.interruptEase()
    this.zoomBy(1 / this.zoom)
    this.setTranslate(0, 0)
    this.setViewIsReset(true)
    this.setEase(Ease.Slow)
  }

  private _viewIsReset = true
  private viewIsReset = () => this._viewIsReset
  setViewIsReset = (val: boolean) => {
    if (val !== this._viewIsReset) {
      this._viewIsReset = val
      this.onViewIsResetChange(val)
    }
  }

  private viewSame = (a: Point2, b: Point2, c: number, d: number) =>
    fequals(c, d, 1000) && a.equals(b, 100000)

  // snapshot view state
  private saveView = (): ViewState => ({
    zoom: this.zoom,
    trans: this.trans.clone(),
    nodeMid: this.nodeMid.clone(),
  })

  // call interruptEase before f
  private interruptEaseWrapper =
    <A extends ReadonlyArray<unknown>, R>(f: (...params: A) => R) =>
    (...args: A): R => {
      this.interruptEase()
      return f(...args)
    }
}

import { Point2, dist, p2dist } from '@/app/utils'
import { Ease } from './pan_zoom_utils'

type GetTransFunction = () => Point2
type GetZoomFunction = () => number
type SetTranslateFunction = (tx: number, ty: number) => void
type SetZoomToFunction = (z: number, originX: number, originY: number) => void
type ManipViewFunction = (
  zf: number,
  z: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  nmx: number,
  nmy: number
) => void
type SetEaseFunction = (e: Ease) => void
type AnimateFunction = () => void
type ViewIsResetFunction = () => boolean
type SetViewIsResetFunction = (val: boolean) => void

export default class PointerLogic {
  private getTrans: GetTransFunction
  private getZoom: GetZoomFunction
  private setTranslate: SetTranslateFunction
  private setZoomTo: SetZoomToFunction
  private manipView: ManipViewFunction
  private setEase: SetEaseFunction
  private animate: AnimateFunction
  private viewIsReset: ViewIsResetFunction
  private setViewIsReset: SetViewIsResetFunction

  private getnodemid

  constructor(
    getTrans: GetTransFunction,
    getZoom: GetZoomFunction,
    setTranslate: SetTranslateFunction,
    setZoomTo: SetZoomToFunction,
    manipView: ManipViewFunction,
    setEase: SetEaseFunction,
    animate: AnimateFunction,
    viewIsReset: ViewIsResetFunction,
    setViewIsReset: SetViewIsResetFunction,
    getnodemid: () => Point2
  ) {
    this.getTrans = getTrans
    this.getZoom = getZoom
    this.setTranslate = setTranslate
    this.setZoomTo = setZoomTo
    this.manipView = manipView
    this.setEase = setEase
    this.animate = animate
    this.viewIsReset = viewIsReset
    this.setViewIsReset = setViewIsReset
    this.getnodemid = getnodemid
  }

  private currentAction: PointerAction | null = null
  private start = new Point2(0, 0) // pointer down event client coords
  private from = new Point2(0, 0) // initial node translate
  private wasReset = true // was view reset (for cancel)
  private isTap = true

  readonly pointerDown = (e: PointerEvent) => {
    if (this.currentAction !== null) return

    switch (e.pointerType) {
      case 'pen':
      // if (e.target instanceof HTMLElement && e.target.isContentEditable) break
      case 'touch':
        this.start.set(e.clientX, e.clientY)
        this.from.setTo(this.getTrans())
        this.wasReset = this.viewIsReset()
        this.isTap = true
        this.setEase(Ease.Fast)
        break
    }

    switch (e.pointerType) {
      case 'mouse':
        console.log(e.clientX + ' ' + e.clientY);
        
        break
      case 'pen':
        this.currentAction = this.startAction(
          this.penDrag,
          this.penDragStop,
          e.pointerType
        )
        break
      case 'touch':
        this.touchDown(e)
        this.currentAction = this.startAction(
          this.touchManip,
          this.touchManipStop,
          e.pointerType
        )
        break
      default:
        console.warn(`unknown device: ${e.pointerType}`)
    }
  }

  ///// PEN DRAG

  private penDrag = (e: PointerEvent) => {
    this.dragHelper(e)
  }

  private penDragStop = (e: PointerEvent) => {
    if (e.type === 'pointercancel') {
      this.setEase(Ease.None)
      this.setTranslate(this.from.x, this.from.y)
      if (this.wasReset) this.setViewIsReset(true)
      this.animate()
    }
    console.log(e.type)
    return true
  }

  // drag (also used in 1 finger touch)
  private dragHelper = (e: PointerEvent) => {
    if (this.isTap) {
      if (!this.inDeadzone(e.clientX, e.clientY)) this.isTap = false
    } else {
      this.setEase(Ease.Least) // allows first move to catch up smoothly
    }
    if (!this.isTap) {
      this.setTranslate(
        this.from.x + e.clientX - this.start.x,
        this.from.y + e.clientY - this.start.y
      )
      this.animate()
    }
  }

  ///// TOUCH MANIP

  private touch1: number | null = null
  private touch2: number | null = null
  private touchStart1: Point2 = new Point2(0, 0)
  private touchStart2: Point2 = new Point2(0, 0)
  private startDist = 0 // dist btwn 2 fingers
  private zoomFrom = 0
  private touchNow1: Point2 = new Point2(0, 0)
  private touchNow2: Point2 = new Point2(0, 0)
  private testnodemid: Point2 = new Point2(0, 0)

  // extra work for touch down
  private touchDown = (e: PointerEvent) => {
    this.trackTouches(e)
  }

  private touchManip = (e: PointerEvent) => {
    this.trackTouches(e)
    // one finger drag
    if (e.pointerId === this.touch1 && this.touch2 === null) {
      this.dragHelper(e)
      this.touchNow1.set(e.clientX, e.clientY)
    }
    // two finger manip, finger 1
    else if (e.pointerId === this.touch1) {
      this.touchNow1.set(e.clientX, e.clientY)
      this.twoFingerManip()
    }
    // two finger manip, finger 2
    else if (e.pointerId === this.touch2) {
      this.touchNow2.set(e.clientX, e.clientY)
      this.twoFingerManip()
    }
  }

  private twoFingerManip = () => {
    const midx = (this.touchNow1.x + this.touchNow2.x) / 2
    const midy = (this.touchNow1.y + this.touchNow2.y) / 2

    const factor = p2dist(this.touchNow1, this.touchNow2) / this.startDist
    // console.log(midx + ' '+ midy);

    // this.setZoomTo(this.zoomFrom * factor, midx, midy)
    // this.setTranslate(
    //   this.from.x + midx - this.start.x,
    //   this.from.y + midy - this.start.y
    // )
    this.manipView(
      this.zoomFrom,
      this.zoomFrom * factor,
      this.start.x,
      this.start.y,
      midx,
      midy,
      this.testnodemid.x,
      this.testnodemid.y,
      this.from.x,
      this.from.y
    )
    this.animate()
  }

  private touchManipStop = (e: PointerEvent) => {
    console.log(e.type)

    // drop second finger
    if (e.pointerId === this.touch2) {
      this.touch2 = null
      this.restartFrom(this.touchNow1.x, this.touchNow1.y)
    }
    // drop first finger
    else if (e.pointerId === this.touch1) {
      this.touch1 = null
      if (this.touch2 !== null) {
        // second finger replace first
        this.touch1 = this.touch2
        this.touch2 = null
        this.touchStart1.setTo(this.touchStart2)
        this.touchNow1.setTo(this.touchNow2)
        this.restartFrom(this.touchNow1.x, this.touchNow1.y)
      }
    }
    // all fingers up
    return this.touch1 === null && this.touch2 === null
  }

  private trackTouches = (e: PointerEvent) => {
    if (this.touch1 === null) {
      // first finger
      this.touch1 = e.pointerId
      this.touchStart1.set(e.clientX, e.clientY)
      this.touchNow1.set(e.clientX, e.clientY)
    } else if (this.touch2 === null && e.pointerId !== this.touch1) {
      // second finger
      this.touch2 = e.pointerId
      this.touchStart2.set(e.clientX, e.clientY)
      this.touchNow2.set(e.clientX, e.clientY)
      // start moving from midpoint of fingers
      this.restartFrom(
        (this.touchNow1.x + this.touchNow2.x) / 2,
        (this.touchNow1.y + this.touchNow2.y) / 2
      )
      this.startDist = p2dist(this.touchNow1, this.touchNow2)
      this.zoomFrom = this.getZoom()
      this.testnodemid.setTo(this.getnodemid())
    }
  }

  private restartFrom = (startX: number, startY: number) => {
    this.start.set(startX, startY)
    this.from.setTo(this.getTrans())
  }

  ///// utils

  private inDeadzone(x: number, y: number) {
    const dx = this.start.x - x
    const dy = this.start.y - y
    return dx * dx + dy * dy < TAP_DEADZONE * TAP_DEADZONE
  }

  private startAction = (
    moveHandler: PointerEventHandler,
    stopHandler: PointerStopHandler,
    type: string
  ) => {
    return _startAction(moveHandler, stopHandler, type, this.stopAction)
  }

  private stopAction = () => {
    if (!this.currentAction)
      console.error('pan_zoom (pointer) - action was null (stop)')
    else {
      this.currentAction.stop()
      this.currentAction = null
    }
  }
}

///// utils

const TAP_DEADZONE = 20

type PointerEventHandler = (e: PointerEvent) => void
type PointerStopHandler = (e: PointerEvent) => boolean // true to end action
type PointerAction = {
  type: string
  stop: () => void
}

const _startAction = (
  moveHandler: PointerEventHandler,
  stopHandler: PointerStopHandler,
  type: string,
  stopActionFunction: () => void
): PointerAction => {
  const mh = wrapHandlerType(moveHandler, type)
  const _sh = wrapHandlerType(stopHandler, type)
  const sh = (e: PointerEvent) => {
    if (_sh(e)) stopActionFunction() // true to end action
  }

  window.addEventListener('pointermove', mh)
  window.addEventListener('pointerup', sh)
  window.addEventListener('pointercancel', sh)
  return {
    type,
    stop: () => {
      window.removeEventListener('pointermove', mh)
      window.removeEventListener('pointerup', sh)
      window.removeEventListener('pointercancel', sh)
    },
  }
}

const wrapHandlerType = (
  h: PointerEventHandler | PointerStopHandler,
  type: string
) => {
  return (e: PointerEvent) => {
    if (e.pointerType === type) return h(e)
  }
}

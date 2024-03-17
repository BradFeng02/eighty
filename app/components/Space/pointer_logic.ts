import { Point2, Dbt, dist, p2dist } from '@/app/utils'
import {
  Ease,
  ViewState,
  dummyViewState,
  Fn,
  PointerEvDetails,
} from './pan_zoom_utils'

export default class PointerLogic {
  private readonly getTrans: Fn.GetTrans
  private readonly saveView: Fn.SaveView
  private readonly setTranslate: Fn.SetTranslate
  private readonly zoomIn: Fn.ZoomIn
  private readonly resetView: Fn.ResetView
  private readonly manipView: Fn.ManipView
  private readonly setEase: Fn.SetEase
  private readonly animate: Fn.Animate
  private readonly viewIsReset: Fn.ViewIsReset
  private readonly setViewIsReset: Fn.SetViewIsReset

  // prettier-ignore
  constructor( getTrans: Fn.GetTrans, saveView: Fn.SaveView, setTranslate: Fn.SetTranslate, zoomIn: Fn.ZoomIn, resetView: Fn.ResetView, manipView: Fn.ManipView, setEase: Fn.SetEase, animate: Fn.Animate, viewIsReset: Fn.ViewIsReset, setViewIsReset: Fn.SetViewIsReset) {
    this.getTrans = getTrans
    this.saveView = saveView
    this.setTranslate = setTranslate
    this.zoomIn = zoomIn
    this.resetView = resetView
    this.manipView = manipView
    this.setEase = setEase
    this.animate = animate
    this.viewIsReset = viewIsReset
    this.setViewIsReset = setViewIsReset
  }

  readonly destroy = () => {
    if (this.currentAction) {
      this.stopAction()
    }
  }

  private currentAction: PointerAction | null = null
  private start = new Point2(0, 0) // pointer down event client coords
  private from = new Point2(0, 0) // initial node translate
  private wasReset = true // was view reset (for cancel)
  private _isTap = true
  private cancelable = true

  private isTap = () => this._isTap
  private setIsTap = (val: boolean) => {
    this._isTap = val
    if (!val) this.cancelDoubleTap() // cancel double tap if move
  }

  readonly pointerDown = (e: PointerEvent) => {
    if (this.currentAction !== null) return

    switch (e.pointerType) {
      case 'pen':
      case 'touch':
        if (this.shouldDoubleTap(e)) {
          if (this.viewIsReset()) this.zoomIn(e.clientX, e.clientY)
          else this.resetView()
          this.animate()
          return
        }

        this.start.set(e.clientX, e.clientY)
        this.from.setTo(this.getTrans())
        this.wasReset = this.viewIsReset()
        this.setIsTap(true)
        this.cancelable = true
        this.setEase(Ease.Fast)
        break
    }

    switch (e.pointerType) {
      case 'mouse':
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

  ///// DOUBLE TAP

  private lastTap: PointerEvDetails | null = null

  // prettier-ignore
  private shouldDoubleTap = (e: PointerEvent): boolean => {
    // second tap, fast enough, same type, close enough
    const couldBeDbt = this.lastTap && e.timeStamp - this.lastTap.time < DBL_TAP_WINDOW && e.pointerType === this.lastTap.type && dist(e.clientX, e.clientY, this.lastTap.clientX, this.lastTap.clientY) < TAP_DEADZONE * 2
    //// NOT DOUBLE TAP
    if (this.lastTap === null || !couldBeDbt) return this._dbtHelper(e, true, false) // not valid: save and don't double tap
    const tgtDbt = this.targetDbt(e.target)
    //// DISABLED
    if (tgtDbt === Dbt.Disable) return this._dbtHelper(e, false, false) // disable: reset and don't double tap
    //// TOGGLE
    else if (tgtDbt === Dbt.Toggle || this.targetDbt(this.lastTap.target) === Dbt.Toggle) {
      if (e.target === this.lastTap.target) return this._dbtHelper(e, false, true) // same target: reset and double tap
      else return this._dbtHelper(e, true, false) // different target: save and don't double tap
    }
    //// NORMAL
    else return this._dbtHelper(e, false, true) // normal: reset and double tap
  }

  private _dbtHelper = (e: PointerEvent, save: boolean, res: boolean) => {
    if (save) this.saveTap(e)
    else this.lastTap = null
    return res
  }

  private targetDbt = (tgt: EventTarget | null): Dbt => {
    if (tgt instanceof HTMLElement) {
      if (tgt.classList.contains(Dbt.Disable)) return Dbt.Disable
      if (tgt.classList.contains(Dbt.Toggle)) return Dbt.Toggle
      return Dbt.Normal
    }
    return Dbt.Disable
  }

  private saveTap = (e: PointerEvent) => {
    if (this.targetDbt(e.target) === Dbt.Disable) {
      this.lastTap = null
      return
    }
    this.lastTap = {
      time: e.timeStamp,
      type: e.pointerType,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target,
    }
  }

  private cancelDoubleTap = () => {
    this.lastTap = null
  }

  ///// PEN DRAG

  private penDrag = (e: PointerEvent) => {
    this.dragHelper(e)
  }

  private penDragStop = (e: PointerEvent) => {
    if (e.type === 'pointercancel') this.cancelMove()
    return true
  }

  // drag (also used in 1 finger touch)
  private dragHelper = (e: PointerEvent) => {
    if (this.isTap()) {
      if (!this.inDeadzone(e.clientX, e.clientY)) this.setIsTap(false)
    } else {
      this.setEase(Ease.Least) // allows first move to catch up smoothly
    }
    if (!this.isTap()) {
      this.setTranslate(
        this.from.x + e.clientX - this.start.x,
        this.from.y + e.clientY - this.start.y
      )
      this.animate()
    }
  }

  ///// TOUCH MANIP

  private touch1: number | null = null // pointer id
  private touch2: number | null = null
  private touchPos1: Point2 = new Point2(0, 0) // current touch positions
  private touchPos2: Point2 = new Point2(0, 0)
  // starting values for 2 fingers:
  private distStart: number = 0 // dist between touches
  private viewStart: ViewState = dummyViewState() // view state

  // extra work for touch down
  private touchDown = (e: PointerEvent) => {
    this.trackTouches(e)
  }

  private touchManip = (e: PointerEvent) => {
    this.trackTouches(e)
    // one finger drag
    if (e.pointerId === this.touch1 && this.touch2 === null) {
      this.touchPos1.set(e.clientX, e.clientY)
      this.dragHelper(e)
    }
    // two finger manip, finger 1
    else if (e.pointerId === this.touch1) {
      this.touchPos1.set(e.clientX, e.clientY)
      this.twoFingerManip()
    }
    // two finger manip, finger 2
    else if (e.pointerId === this.touch2) {
      this.touchPos2.set(e.clientX, e.clientY)
      this.twoFingerManip()
    }
  }

  private twoFingerManip = () => {
    const factor = p2dist(this.touchPos1, this.touchPos2) / this.distStart
    // prettier-ignore
    this.manipView(
      this.viewStart, this.start, factor,
      (this.touchPos1.x + this.touchPos2.x) / 2,
      (this.touchPos1.y + this.touchPos2.y) / 2
    )
    this.animate()
  }

  private touchManipStop = (e: PointerEvent) => {
    if (this.cancelable && e.type === 'pointercancel') this.cancelMove()
    // drop second finger
    if (e.pointerId === this.touch2) {
      this.touch2 = null
      this.restartFrom(this.touchPos1.x, this.touchPos1.y)
    }
    // drop first finger
    else if (e.pointerId === this.touch1) {
      this.touch1 = null
      // second finger replace first
      if (this.touch2 !== null) {
        this.touch1 = this.touch2
        this.touch2 = null
        this.touchPos1.setTo(this.touchPos2)
        this.restartFrom(this.touchPos1.x, this.touchPos1.y)
      }
    }
    // all fingers up
    return this.touch1 === null && this.touch2 === null
  }

  private trackTouches = (e: PointerEvent) => {
    if (this.touch1 === null) {
      // first finger
      this.touch1 = e.pointerId
      this.touchPos1.set(e.clientX, e.clientY)
    } else if (this.touch2 === null && e.pointerId !== this.touch1) {
      // fires first time two fingers
      this.cancelable = false // if two fingers, can't cancel
      this.setIsTap(false) // also not tap anymore
      // second finger
      this.touch2 = e.pointerId
      this.touchPos2.set(e.clientX, e.clientY)
      // start moving from midpoint of fingers
      this.restartFrom(
        (this.touchPos1.x + this.touchPos2.x) / 2,
        (this.touchPos1.y + this.touchPos2.y) / 2
      )
      this.distStart = p2dist(this.touchPos1, this.touchPos2)
      this.viewStart = this.saveView()
    }
  }

  private restartFrom = (startX: number, startY: number) => {
    this.start.set(startX, startY)
    this.from.setTo(this.getTrans())
  }

  ///// utils

  private cancelMove = () => {
    this.cancelDoubleTap()
    this.setEase(Ease.None)
    this.setTranslate(this.from.x, this.from.y)
    if (this.wasReset) this.setViewIsReset(true)
    this.animate()
  }

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

const TAP_DEADZONE = 21
const DBL_TAP_WINDOW = 400

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

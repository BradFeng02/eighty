import { Point2, p2dist } from '@/app/utils'
import { Ease, ViewState, dummyViewState, Fn } from './pan_zoom_utils'

export default class PointerLogic {
  private getTrans: Fn.GetTrans
  private saveView: Fn.SaveView
  private setTranslate: Fn.SetTranslate
  private manipView: Fn.ManipView
  private setEase: Fn.SetEase
  private animate: Fn.Animate
  private viewIsReset: Fn.ViewIsReset
  private setViewIsReset: Fn.SetViewIsReset

  // prettier-ignore
  constructor( getTrans: Fn.GetTrans, saveView: Fn.SaveView, setTranslate: Fn.SetTranslate, manipView: Fn.ManipView, setEase: Fn.SetEase, animate: Fn.Animate, viewIsReset: Fn.ViewIsReset, setViewIsReset: Fn.SetViewIsReset) {
    this.getTrans = getTrans
    this.saveView = saveView
    this.setTranslate = setTranslate
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
  private isTap = true
  private cancelable = true

  readonly pointerDown = (e: PointerEvent) => {
    if (this.currentAction !== null) return

    switch (e.pointerType) {
      case 'pen':
      case 'touch':
        this.start.set(e.clientX, e.clientY)
        this.from.setTo(this.getTrans())
        this.wasReset = this.viewIsReset()
        this.isTap = true
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
    if (this.cancelable && e.type === 'pointercancel') {
      this.setEase(Ease.None)
      this.setTranslate(this.from.x, this.from.y)
      if (this.wasReset) this.setViewIsReset(true)
      this.animate()
    }
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
      this.cancelable = false // if two fingers, can't cancel
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

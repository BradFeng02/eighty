import { Point2 } from '@/app/utils'
import { Ease } from './pan_zoom_utils'

type TranslateToFunction = (tx: number, ty: number) => void
type ZoomToFunction = (factor: number, originX: number, originY: number) => void
type SetEaseFunction = (e: Ease) => void
type AnimateFunction = () => void

export default class PointerLogic {
  private translateTo: TranslateToFunction
  private zoomTo: ZoomToFunction
  private setEase: SetEaseFunction
  private animate: AnimateFunction

  constructor(
    translateTo: TranslateToFunction,
    zoomTo: ZoomToFunction,
    setEase: SetEaseFunction,
    animate: AnimateFunction
  ) {
    this.translateTo = translateTo
    this.zoomTo = zoomTo
    this.setEase = setEase
    this.animate = animate
  }

  private currentAction: PointerAction | null = null
  private start = new Point2(0, 0)
  private from = new Point2(0, 0)
  private isTap = true
  private temp = new Point2(0, 0)

  readonly pointerDown = (e: PointerEvent, trans: Point2) => {
    if (this.currentAction !== null) return

    switch (e.pointerType) {
      case 'mouse':
        break
      case 'pen':
        // if (e.target instanceof HTMLElement && e.target.isContentEditable) break
        this.start.set(e.clientX, e.clientY)
        this.from.set(trans.x, trans.y)
        this.isTap = true
        this.setEase(Ease.Fast)
        this.currentAction = startAction(
          this.penDrag,
          this.penDragStop,
          e.pointerType
        )
        break
      case 'touch':
        // this.start.set(e.clientX, e.clientY)
        // this.from.set(trans.x, trans.y)
        // startMove(this.test, this.teststop)
        break
      default:
        console.warn(`unknown device: ${e.pointerType}`)
    }
  }

  private stopAction = () => {
    if (!this.currentAction)
      console.error('pan_zoom (pointer) - action was null (stop)')
    else {
      this.currentAction.stop()
      this.currentAction = null
    }
  }

  ///// PEN DRAG

  private penDrag = (e: PointerEvent) => {
    if (this.isTap) {
      if (!this.inDeadzone(e.clientX, e.clientY)) this.isTap = false
    } else {
      this.setEase(Ease.Least) // allows first move to catch up smoothly
    }
    if (!this.isTap) {
      this.translateTo(
        this.from.x + e.clientX - this.start.x,
        this.from.y + e.clientY - this.start.y
      )
      this.animate()
    }
    this.temp.set(e.clientX, e.clientY)
  }

  private penDragStop = (e: PointerEvent) => {
    if (e.type === 'pointercancel') {
      this.setEase(Ease.None)
      this.translateTo(this.from.x, this.from.y)
      this.animate()
    }
    console.log(e.type + ' ' + e.clientX + ',' + e.clientY)

    const dx = this.temp.x - this.start.x
    const dy = this.temp.y - this.start.y
    console.log(Math.sqrt(dx * dx + dy * dy))

    this.stopAction()
  }

  ///// utils

  private inDeadzone(x: number, y: number) {
    const dx = this.start.x - x
    const dy = this.start.y - y
    return dx * dx + dy * dy < TAP_DEADZONE * TAP_DEADZONE
  }
}

///// utils

const TAP_DEADZONE = 20

type PointerEventHandler = (e: PointerEvent) => void
type PointerAction = {
  type: string
  stop: () => void
}

const startAction = (
  moveHandler: PointerEventHandler,
  stopHandler: PointerEventHandler,
  type: string
): PointerAction => {
  const mh = wrapHandlerType(moveHandler, type)
  const sh = wrapHandlerType(stopHandler, type)
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

const wrapHandlerType = (h: PointerEventHandler, type: string) => {
  return (e: PointerEvent) => {
    if (e.pointerType === type) h(e)
  }
}

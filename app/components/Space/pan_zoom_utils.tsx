import { Point2, clamp } from '@/app/utils'

export const PADDING = 10
export const TAP_DEADZONE = 10
export const DOUBLE_TAP_DEADZONE = 30
export const DOUBLE_TAP_MS = 500

///// transition

const SMOOTH_TRANSITION_PROP = 'opacity, scale, translate'
const NO_TRANSITION_PROP = 'none'
const SLOW_TRANSITION = '500ms'
const FAST_TRANSITION = '150ms'
const SLOW_TIMING = 'ease'
const FAST_TIMING = 'cubic-bezier(0, 0, 0.2, 1)'

export enum Transition {
  None,
  Fast,
  Slow,
}

export const setTransition = (node: HTMLElement, speed: Transition) => {
  switch (speed) {
    case Transition.None:
      node.style.transitionProperty = NO_TRANSITION_PROP
      break
    case Transition.Fast:
      node.style.transitionProperty = SMOOTH_TRANSITION_PROP
      node.style.transitionDuration = FAST_TRANSITION
      node.style.transitionTimingFunction = FAST_TIMING
      break
    case Transition.Slow:
      node.style.transitionProperty = SMOOTH_TRANSITION_PROP
      node.style.transitionDuration = SLOW_TRANSITION
      node.style.transitionTimingFunction = SLOW_TIMING
      break
  }
}

///// drag pan

export type TranslateFunction = (tx: number, ty: number) => void
export class dragPanAction {
  private start: Point2 // pointer down event client coords
  private from: Point2 // starting translate
  private transFun: TranslateFunction

  /**
   * drag start
   * @param start pointer down event client coords
   * @param from starting translate
   * @param translateFun function to pan to given trans (panToInSpace)
   */
  constructor(
    startX: number,
    startY: number,
    fromX: number,
    fromY: number,
    translateFun: TranslateFunction
  ) {
    console.log('drag')
    this.start = new Point2(startX, startY)
    this.from = new Point2(fromX, fromY)
    this.transFun = translateFun
  }

  readonly dragMove = (ex: number, ey: number) => {
    this.transFun(
      this.from.x + ex - this.start.x,
      this.from.y + ey - this.start.y
    )
  }

  readonly dragEnd = () => {}
}

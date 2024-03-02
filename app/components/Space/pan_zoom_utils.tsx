import { Point2, clamp } from '@/app/utils'

export type ViewState = {
  zoom: number
  trans: Point2
  nodeMid: Point2
}

export const dummyViewState = () => ({
  zoom: 0,
  trans: new Point2(0, 0),
  nodeMid: new Point2(0, 0),
})

export const PADDING = 10
export const TAP_DEADZONE = 10
export const DOUBLE_TAP_DEADZONE = 30
export const DOUBLE_TAP_MS = 500

///// animation easing

export enum Ease {
  None,
  Least,
  Fast,
  Smooth,
}

/**
 * ease value for animation
 * @param elapsed time since ease start
 * @returns number [0, 1]
 */
export const easeValue = (
  ease: Ease,
  elapsed: number,
  dx: number,
  dy: number,
  zoom1: number,
  zoom2: number
): number => {
  switch (ease) {
    case Ease.None:
      return 1
    case Ease.Least:
      return quadEaseOut(elapsed / 25)
    case Ease.Fast:
      return quadEaseOut(elapsed / 50)
    case Ease.Smooth:
      return dynamicEaseOut(elapsed, dx, dy, zoom1, zoom2)
  }
}

const dynamicEaseOut = (
  elapsed: number,
  dx: number,
  dy: number,
  zoom1: number,
  zoom2: number
) => {
  let easeDuration = 250
  if (zoom1 === zoom2)
    easeDuration *= clamp(Math.sqrt(dx * dx + dy * dy) / 130, 1, 2)
  else {
    const r = zoom1 > zoom2 ? zoom1 / zoom2 : zoom2 / zoom1
    easeDuration *= clamp(r / 1.3, 1, 2)
  }
  return quinticEaseOut(elapsed / easeDuration)
}

const quadEaseOut = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 2

const quinticEaseOut = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 5

///// function type defs

export namespace Fn {
  export type GetTrans = () => Point2
  export type SaveView = () => ViewState
  export type SetTranslate = (tx: number, ty: number) => void
  export type ManipView = (
    view: ViewState,
    p: Point2,
    factor: number,
    qx: number,
    qy: number
  ) => void
  export type SetEase = (e: Ease) => void
  export type Animate = () => void
  export type ViewIsReset = () => boolean
  export type SetViewIsReset = (val: boolean) => void
  export type Pan = (dx: number, dy: number) => void
  export type ZoomTo = (
    factor: number,
    originX: number,
    originY: number
  ) => void
}

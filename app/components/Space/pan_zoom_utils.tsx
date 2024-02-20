import { clamp } from '@/app/utils'

export const PADDING = 10
export const TAP_DEADZONE = 10
export const DOUBLE_TAP_DEADZONE = 30
export const DOUBLE_TAP_MS = 500

///// wheel

export const SCROLL_STEP = 50
export const ZOOM_STEP = 15
export const SCROLL_WINDOW_MS = 100

export enum WheelType {
  Unknown,
  Wheel,
  Smooth,
}

export const normalizeWheelDelta = (delta: number, mode: number) => {
  // some browsers wheel not pixel
  let d = delta
  if (mode) {
    if (mode == 1) {
      d *= 40
    } else {
      d *= 800
    }
  }
  return d
}

// returns [adjusted delta, using wheel]
export const adjustWheel = (
  delta: number,
  mag: number,
  lastMag: number,
  elapsed: number
): [number, WheelType] => {
  if (!delta) return [delta, WheelType.Unknown] // skip 0
  // if big enough and same magnitude, likely wheel -> fixed step
  if (
    mag > SCROLL_STEP &&
    lastMag > SCROLL_STEP &&
    (mag % lastMag === 0 || lastMag % mag === 0) // lag sometimes multiple
  )
    return [SCROLL_STEP * Math.sign(delta), WheelType.Wheel]
  // starting new scroll -> clamp in case is wheel (big delta)
  if (elapsed > SCROLL_WINDOW_MS)
    return [clamp(delta, -SCROLL_STEP, SCROLL_STEP), WheelType.Unknown]
  return [delta, WheelType.Smooth]
}

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

import { createContext } from 'react'

const SCROLL_STOP_MS = 300

export enum WheelTarget {
  None,
  Space,
  Div,
}

export class WheelContextObject {
  constructor() {}

  private lastWheelTime: number = -1000
  private scrollTgt: WheelTarget = WheelTarget.None

  private currentTarget = (t: number) => {
    if (this.elapsed(t) > SCROLL_STOP_MS) this.scrollTgt = WheelTarget.None
    return this.scrollTgt
  }

  readonly elapsed = (t: number) => t - this.lastWheelTime

  readonly canScroll = (t: number, tgt: WheelTarget) => {
    const cur = this.currentTarget(t)
    return cur === tgt || cur === WheelTarget.None
  }

  readonly startScroll = (t: number, tgt: WheelTarget) => {
    this.lastWheelTime = t
    this.scrollTgt = tgt
  }
}

export const WheelContext = createContext(new WheelContextObject())

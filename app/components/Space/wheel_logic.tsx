import { Point2, clamp } from '@/app/utils'

type PanFunction = (dx: number, dy: number) => void
type ZoomToFunction = (factor: number, originX: number, originY: number) => void

export default class WheelLogic {
  private pan: PanFunction
  private zoomTo: ZoomToFunction

  constructor(pan: PanFunction, zoomTo: ZoomToFunction) {
    this.pan = pan
    this.zoomTo = zoomTo
  }

  private lastWheelTime: number = -1000
  private lastMag = new Point2(-1, -1)

  /**
   * @returns true if view changed
   */
  readonly wheel = (e: WheelEvent) => {
    const dx_px = normalizeWheelDelta(e.deltaX, e.deltaMode)
    const dy_px = normalizeWheelDelta(e.deltaY, e.deltaMode)
    const magX = Math.abs(dx_px)
    const magY = Math.abs(dy_px)
    const elapsed = e.timeStamp - this.lastWheelTime
    this.lastWheelTime = e.timeStamp

    const dx = this.lastMag.x === -1 ? 0 : dx_px // first ever scroll, ignore
    const dy = this.lastMag.y === -1 ? 0 : dy_px // first ever scroll, ignore
    const wheelX = adjustWheel(dx, magX, this.lastMag.x, elapsed)
    const wheelY = adjustWheel(dy, magY, this.lastMag.y, elapsed)

    // unkn must come before wheel!!
    const unkn = wheelX === WheelType.Unknown && wheelY === WheelType.Unknown
    const wheel = wheelX !== WheelType.Smooth && wheelY !== WheelType.Smooth

    // if is wheel or unknown
    if (wheel) this.lastMag.set(magX, magY)
    // if ever not wheel, disable possibility for rest of scroll
    else this.lastMag.set(0.11111111111, 0.11111111111)

    // scroll
    if (!e.ctrlKey && (dx || dy)) {
      //     just dx if 0     clamp if unknown     step if wheel   else smooth
      const panx = dx && (unkn ? clmp(dx) : wheel ? scrollStep(dx) : dx)
      const pany = dy && (unkn ? clmp(dy) : wheel ? scrollStep(dy) : dy)
      this.pan(-panx, -pany)
      return true
    }
    // zoom
    else if (e.ctrlKey && dy) {
      const zoomAmt = unkn ? zlim(dy) : wheel ? ZOOM_STEP : Math.abs(dy)
      const factor = 1 + zoomAmt / 100
      this.zoomTo(dy < 0 ? factor : 1 / factor, e.clientX, e.clientY)
      return true
    }
    return false
  }
}

///// utils

const SCROLL_STEP = 50
const ZOOM_STEP = 15
const SCROLL_WINDOW_MS = 100

enum WheelType {
  Unknown,
  Wheel,
  Smooth,
}

const normalizeWheelDelta = (delta: number, mode: number) => {
  // some browsers wheel not pixel
  let d = delta
  if (mode) d *= mode === 1 ? 40 : 800
  return d
}

const adjustWheel = (
  delta: number,
  mag: number,
  lastMag: number,
  elapsed: number
): WheelType => {
  if (!delta) return WheelType.Unknown // skip 0
  // if big enough and same magnitude, likely wheel -> fixed step
  if (
    mag > SCROLL_STEP &&
    lastMag > SCROLL_STEP &&
    (mag % lastMag === 0 || lastMag % mag === 0) // lag sometimes multiple
  )
    return WheelType.Wheel
  // starting new scroll -> clamp in case is wheel (big delta)
  if (elapsed > SCROLL_WINDOW_MS) return WheelType.Unknown
  return WheelType.Smooth
}

const clmp = (d: number) => clamp(d, -SCROLL_STEP, SCROLL_STEP)
const scrollStep = (d: number) => SCROLL_STEP * Math.sign(d)
const zlim = (dy: number) => Math.min(Math.abs(dy), ZOOM_STEP)

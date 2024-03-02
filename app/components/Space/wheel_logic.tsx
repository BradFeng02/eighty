import { Point2, clamp } from '@/app/utils'
import { Ease, Fn } from './pan_zoom_utils'

export default class WheelLogic {
  private pan: Fn.Pan
  private zoomTo: Fn.ZoomTo
  private setEase: Fn.SetEase

  constructor(pan: Fn.Pan, zoomTo: Fn.ZoomTo, setEase: Fn.SetEase) {
    this.pan = pan
    this.zoomTo = zoomTo
    this.setEase = setEase
  }

  private lastWheelTime: number = -1000
  private lastMag = new Point2(-1, -1)
  private wheelMagX = 0.11111111111
  private wheelMagY = 0.11111111111

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

    // store wheel magnitude to predict unknown
    if (!unkn && wheel) {
      if (magX) this.wheelMagX = magX
      if (magY) this.wheelMagY = magY
    }

    this.setEase(wheel ? Ease.Smooth : Ease.Fast)

    // scroll
    if (!e.ctrlKey && (dx || dy)) {
      //      just dx if 0    unknown (clamp or step)    step if wheel    else smooth
      const panx = dx && (unkn ? this.xUnk(dx) : wheel ? scrollStep(dx) : dx)
      const pany = dy && (unkn ? this.yUnk(dy) : wheel ? scrollStep(dy) : dy)
      this.pan(-panx, -pany)
      return true
    }
    // zoom
    else if (e.ctrlKey && dy) {
      const zoomAmt = unkn ? this.zUnk(dy) : wheel ? ZOOM_STEP : Math.abs(dy)
      const factor = 1 + zoomAmt / 100
      this.zoomTo(dy < 0 ? factor : 1 / factor, e.clientX, e.clientY)
      return true
    }
    return false
  }

  ///// utils

  private xUnk = (dx: number) => scrollUnk(dx, this.wheelMagX)
  private yUnk = (dy: number) => scrollUnk(dy, this.wheelMagY)
  private zUnk = (dy: number) => {
    const abs = Math.abs(dy)
    if (abs > WHEEL_THRESH && sameMag(abs, this.wheelMagY)) return ZOOM_STEP
    return Math.min(abs, ZOOM_STEP)
  }
}

///// utils

const WHEEL_THRESH = 30
const SCROLL_STEP = 70
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
  if (mag > WHEEL_THRESH && lastMag > WHEEL_THRESH && sameMag(mag, lastMag))
    return WheelType.Wheel
  // starting new scroll -> clamp in case is wheel (big delta)
  if (elapsed > SCROLL_WINDOW_MS) return WheelType.Unknown
  return WheelType.Smooth
}

// mag is sometimes a multiple because batched
const sameMag = (a: number, b: number) => (a > b ? a % b === 0 : b % a === 0)

const scrollUnk = (d: number, wheelmag: number) => {
  const abs = Math.abs(d)
  if (abs > WHEEL_THRESH && sameMag(abs, wheelmag)) return scrollStep(d)
  return clamp(d, -SCROLL_STEP, SCROLL_STEP)
}
const scrollStep = (d: number) => SCROLL_STEP * Math.sign(d)

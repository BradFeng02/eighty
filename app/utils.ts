import { Atkinson_Hyperlegible } from 'next/font/google'

export type Point2 = {
  x: number
  y: number
}

export type RefVal<T> = {
  val: T
}

export const refVal = <T>(val: T) => ({ val })

export const point2 = (x: number, y: number) => ({ x, y })

export const movePt2 = (from: Point2, dx: number, dy: number) =>
  point2(from.x + dx, from.y + dy)

// usage: <className={AKHyper.className}
export const AKHyper = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'block',
  preload: true,
  subsets: ['latin-ext'],
})

export const clamp = (x: number, min: number, max: number) =>
  Math.min(Math.max(x, min), max)

import { log } from 'console'
import { Atkinson_Hyperlegible } from 'next/font/google'

export class Point2 {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  move = (dx: number, dy: number) => {
    this.x += dx
    this.y += dy
  }

  set = (x: number, y: number) => {
    this.x = x
    this.y = y
  }

  equals = (point2: Point2, ek?: number) => {
    return fequals(this.x, point2.x, ek) && fequals(this.y, point2.y, ek)
  }

  clone = () => {
    return new Point2(this.x, this.y)
  }
}

// usage: <className={AKHyper.className}
export const AKHyper = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'block',
  preload: true,
  subsets: ['latin-ext'],
})

export const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

// ek approx. max magnitude of a and b
export const fequals = (a: number, b: number, ek: number = 1) =>
  Math.abs(a - b) < Number.EPSILON * ek

import { Atkinson_Hyperlegible } from 'next/font/google'

// dbt-toggle: must double tap same target (eg. checkbox)
// dbt-disable: don't double tap (eg. counter button)
export enum Dbt {
  Disable = 'dbt-disable',
  Toggle = 'dbt-toggle',
  Normal = '',
}

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

  setTo = (point2: Point2) => {
    this.x = point2.x
    this.y = point2.y
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

export const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

export const p2dist = (a: Point2, b: Point2) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

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

  equals = (point2: Point2) => {
    return this.x === point2.x && this.y === point2.y
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

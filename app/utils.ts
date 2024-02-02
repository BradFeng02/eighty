import { Atkinson_Hyperlegible } from 'next/font/google'

export type Point2 = {
  x: number
  y: number
}

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

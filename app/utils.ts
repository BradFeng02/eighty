import { Atkinson_Hyperlegible } from 'next/font/google'

// usage: <className={AKHyper.className}>
export const AKHyper = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'block',
  preload: true,
  subsets: ['latin-ext'],
})

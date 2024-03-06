import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eighty',
  description: 'TODO',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <h1>scrollt est</h1>
        <h1>scrollt est</h1>
        <h1>scrollt est</h1>
        <h1>scrollt est</h1>
        <h1>scrollt est</h1>
        <h1>scrollt est</h1>

        <div className="ml-12 h-screen w-screen">{children}</div>
      </body>
    </html>
  )
}

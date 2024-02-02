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
        <p>
          test for scroll <br /> (im in layout)
        </p>
        <div className="flex h-screen w-screen items-center justify-center">
          {children}
        </div>
      </body>
    </html>
  )
}

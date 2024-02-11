'use client'

import { ReactNode, useEffect, useState } from 'react'
import { BLOCK_PADDING, GRID_SIZE_PX } from '../Space/constants'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
  children: ReactNode
}

const BlockWrapper = ({ wid, hgt, left, top, children }: Props) => {
  const [color, setColor] = useState('#FFFFFF')

  useEffect(() => {
    setColor(
      `rgb(${Math.random() * 150 + 100}, ${Math.random() * 150 + 100}, ${Math.random() * 150 + 100})`
    )
  }, [])

  return (
    <div
      className="pointer-events-auto absolute overflow-hidden"
      style={{
        width: wid * GRID_SIZE_PX,
        height: hgt * GRID_SIZE_PX,
        left: left * GRID_SIZE_PX,
        top: top * GRID_SIZE_PX,
        backgroundColor: color,
        padding: BLOCK_PADDING,
      }}
    >
      {children}
    </div>
  )
}

export default BlockWrapper

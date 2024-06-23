'use client'

import { MouseEventHandler, ReactNode, useEffect, useState } from 'react'
import { BLOCK_PADDING, GRID_SIZE_PX } from '../Space/constants'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
  onClick?: MouseEventHandler<HTMLDivElement>
  children: ReactNode
}

const BlockWrapper = ({ wid, hgt, left, top, onClick, children }: Props) => {
  const [color, setColor] = useState('#FFFFFF')

  useEffect(() => {
    setColor(
      `rgb(${Math.random() * 150 + 100}, ${Math.random() * 150 + 100}, ${Math.random() * 150 + 100})`
    )
  }, [])

  return (
    <div
      className="pointer-events-auto absolute select-text overflow-hidden"
      style={{
        width: wid * GRID_SIZE_PX,
        height: hgt * GRID_SIZE_PX,
        left: left * GRID_SIZE_PX,
        top: top * GRID_SIZE_PX,
        backgroundColor: color,
        padding: BLOCK_PADDING,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default BlockWrapper

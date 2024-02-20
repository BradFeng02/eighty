import { useEffect, useRef, ReactNode, useState } from 'react'
import PanZoomController from './pan_zoom'
import { GRID_SIZE_PX } from './constants'

type Props = {
  wid: number
  hgt: number
  children: ReactNode
}

const SpaceWrapper = ({ wid, hgt, children }: Props) => {
  const container = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const [opacity, setOpacity] = useState(0)

  // mount & unmount
  useEffect(() => {
    setOpacity(1)

    let controller = new PanZoomController(container, wrapper)
    const resizeObserver = new ResizeObserver(() => controller.resize())
    if (container.current) resizeObserver.observe(container.current)

    return () => {
      resizeObserver.disconnect()
      controller.destroy()
    }
  }, [])

  return (
    <div className="h-full w-full touch-none overflow-clip" ref={container}>
      <div
        ref={wrapper}
        className={`relative border-2 border-gray-600 bg-white`}
        style={{
          width: wid * GRID_SIZE_PX,
          height: hgt * GRID_SIZE_PX,
          left: `calc((100% - ${wid * GRID_SIZE_PX}px) / 2.0)`,
          top: `calc((100% - ${hgt * GRID_SIZE_PX}px) / 2.0)`,
          opacity: opacity,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default SpaceWrapper

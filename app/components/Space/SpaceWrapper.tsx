import { useEffect, useRef, ReactNode, useState } from 'react'
import PanZoomController, {
  FAST_TRANSITION,
  NO_DRAG_TRANSITION_PROP,
} from './pan_zoom_logic'
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
    const controller = new PanZoomController(container, wrapper)
    controller.registerListeners()
    setOpacity(1)

    return () => {
      controller.destroy()
    }
  }, [])

  return (
    <div
      className="h-full w-full touch-none overflow-clip bg-slate-500"
      ref={container}
    >
      <div
        ref={wrapper}
        className={`relative bg-white ease-out`}
        style={{
          width: wid * GRID_SIZE_PX,
          height: hgt * GRID_SIZE_PX,
          left: `calc((100% - ${wid * GRID_SIZE_PX}px) / 2.0)`,
          top: `calc((100% - ${hgt * GRID_SIZE_PX}px) / 2.0)`,
          transitionDuration: FAST_TRANSITION,
          transitionProperty: NO_DRAG_TRANSITION_PROP,
          opacity: opacity,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default SpaceWrapper

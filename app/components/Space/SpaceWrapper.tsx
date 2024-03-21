import React, {
  useEffect,
  useRef,
  ReactNode,
  useState,
  useContext,
} from 'react'
import PanZoomController from './pan_zoom'
import { GRID_SIZE_PX } from './constants'
import { WheelContext } from './WheelContext'
import { CommandBarContext } from '../CommandBar/CommandBarContext'

type Props = {
  wid: number
  hgt: number
  children: ReactNode
}

const SpaceWrapper = ({ wid, hgt, children }: Props) => {
  const toolbar = useContext(CommandBarContext)
  const wheelContext = useContext(WheelContext)
  const container = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const [viewIsReset, setViewIsReset] = useState(true)
  const [hide, setHide] = useState(true)

  // mount & unmount
  useEffect(() => {
    setHide(false)
    // prettier-ignore
    let controller = new PanZoomController(container, wrapper, wheelContext, setViewIsReset)

    return () => {
      controller.destroy()
    }
  }, [container, wrapper, wheelContext])

  const onClickClearToolbar = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) toolbar.clear()
  }

  return (
    <div
      className="h-full w-full touch-none select-none overflow-clip"
      ref={container}
      onClick={onClickClearToolbar}
    >
      <div
        className="pointer-events-none relative touch-none overflow-visible"
        style={{
          width: wid * GRID_SIZE_PX,
          height: hgt * GRID_SIZE_PX,
          left: `calc((100% - ${wid * GRID_SIZE_PX}px) / 2.0)`,
          top: `calc((100% - ${hgt * GRID_SIZE_PX}px) / 2.0)`,
        }}
      >
        <div
          ref={wrapper}
          className={`h-full w-full border-4 ${viewIsReset ? 'border-blue-700' : 'border-gray-600'} bg-white transition-opacity ${hide ? 'opacity-0' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default SpaceWrapper

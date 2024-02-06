import { useEffect, useRef, ReactNode } from 'react'
import styles from './Space.module.css'
import PanZoomController from './pan_zoom_logic'

type props = {
  children: ReactNode
}

const SpaceWrapper = ({ children }: props) => {
  const container = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)

  // mount & unmount
  useEffect(() => {
    const controller = new PanZoomController(container, wrapper)
    controller.registerListeners()
    if (wrapper.current) wrapper.current.style.opacity = '1'

    return () => {
      controller.destroy()
    }
  }, [])

  return (
    <div
      className="flex h-full w-full touch-none items-center justify-center overflow-clip bg-slate-500"
      ref={container}
    >
      <div
        ref={wrapper}
        className={`${styles.checker} ease-out`}
        style={{
          width: '400px',
          height: '250px',
          transitionDuration: '150ms',
          transitionProperty: 'opacity, scale, translate',
          opacity: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default SpaceWrapper

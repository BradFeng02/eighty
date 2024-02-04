import { useEffect, useRef, ReactNode } from 'react'
import styles from './Space.module.css'
import PanZoomController from './pan_zoom_logic'

type props = {
  children: ReactNode
}

const SpaceWrapper = ({ children }: props) => {
  const mouseTarget = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)

  // mount & unmount
  useEffect(() => {
    const controller = new PanZoomController(mouseTarget, container)
    controller.registerListeners()

    return () => {
      controller.destroy()
    }
  }, [])

  return (
    <div
      className="h-full w-full touch-none overflow-clip bg-slate-500"
      ref={mouseTarget}
    >
      <div
        ref={container}
        className={`${styles.checker} ease-out`}
        style={{
          width: '400px',
          height: '250px',
          transitionDuration: '150ms',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default SpaceWrapper

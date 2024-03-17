import { ReactNode, useContext } from 'react'
import { WheelTarget, WheelContext } from './WheelContext'

type Props = {
  children: ReactNode
  className?: string
  scrollableX?: boolean
  scrollableY?: boolean
}

const ScrollableDiv = ({
  children,
  className,
  scrollableX,
  scrollableY,
}: Props) => {
  const wheelContext = useContext(WheelContext)

  const onWheelCapture = (e: React.WheelEvent) => {
    if (
      wheelContext.canScroll(e.timeStamp, WheelTarget.Div) && // can start new scroll or continue scroll
      !e.ctrlKey && // not zooming
      ((scrollableY && !e.deltaX) || // just scroll up/down
        (scrollableX && !e.deltaY) || // just scroll left/right
        (scrollableX && scrollableY)) // scroll any direction
    ) {
      e.stopPropagation()
      wheelContext.startScroll(e.timeStamp, WheelTarget.Div)
    }
  }

  const overflow =
    (scrollableX ? 'overflow-x-auto touch-pan-x' : 'overflow-x-hidden') +
    ' ' +
    (scrollableY ? 'overflow-y-auto touch-pan-y' : 'overflow-y-hidden') +
    (className ? ' ' + className : '')

  return (
    <div className={overflow} onWheelCapture={onWheelCapture}>
      {children}
    </div>
  )
}

export default ScrollableDiv

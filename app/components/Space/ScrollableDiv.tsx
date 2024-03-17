import { ReactNode, RefObject, forwardRef } from 'react'

type Props = {
  children: ReactNode
  className?: string
  scrollableX?: boolean
  scrollableY?: boolean
}

const ScrollableDiv = forwardRef<HTMLDivElement, Props>(function ScrollableDiv(
  { children, className, scrollableX, scrollableY }: Props,
  ref
) {
  const onWheelCapture = (e: React.WheelEvent) => {
    if (scrollableY && !e.ctrlKey && !e.deltaX) e.stopPropagation()
    else if (scrollableX && !e.ctrlKey && !e.deltaY) e.stopPropagation()
  }

  const overflow =
    (scrollableX ? 'overflow-x-auto touch-pan-x' : 'overflow-x-hidden') +
    ' ' +
    (scrollableY ? 'overflow-y-auto touch-pan-y' : 'overflow-y-hidden') +
    (className ? ' ' + className : '')

  return (
    <div ref={ref} className={overflow} onWheelCapture={onWheelCapture}>
      {children}
    </div>
  )
})

export default ScrollableDiv

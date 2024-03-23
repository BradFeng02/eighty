'use client'

import { useMemo } from 'react'
import SpaceContent from './SpaceContent'
import SpaceWrapper from './SpaceWrapper'
import { WheelContext, WheelContextObject } from './WheelContext'

const testSpace = {
  wid: 8,
  hgt: 7,
}

const Space = () => {
  const wheelContext = useMemo(() => new WheelContextObject(), [])
  return (
    <WheelContext.Provider value={wheelContext}>
      <SpaceWrapper wid={testSpace.wid} hgt={testSpace.hgt}>
        <SpaceContent></SpaceContent>
      </SpaceWrapper>
    </WheelContext.Provider>
  )
}

export default Space

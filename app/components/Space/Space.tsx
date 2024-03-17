'use client'

import SpaceContent from './SpaceContent'
import SpaceWrapper from './SpaceWrapper'
import { WheelContext, WheelContextObject } from './WheelContext'

const testSpace = {
  wid: 8,
  hgt: 7,
}

const Space = () => {
  return (
    // shouldn't rerender...
    <WheelContext.Provider value={new WheelContextObject()}>
      <SpaceWrapper wid={testSpace.wid} hgt={testSpace.hgt}>
        <SpaceContent></SpaceContent>
      </SpaceWrapper>
    </WheelContext.Provider>
  )
}

export default Space

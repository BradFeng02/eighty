'use client'

import SpaceContent from './SpaceContent'
import SpaceWrapper from './SpaceWrapper'

const testSpace = {
  wid: 10,
  hgt: 8,
}

const Space = () => {
  return (
    <SpaceWrapper wid={testSpace.wid} hgt={testSpace.hgt}>
      <SpaceContent></SpaceContent>
    </SpaceWrapper>
  )
}

export default Space

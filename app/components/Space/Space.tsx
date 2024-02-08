'use client'

import SpaceContent from './SpaceContent'
import SpaceWrapper from './SpaceWrapper'

const testSpace = {
  wid: 20,
  hgt: 16,
}

const Space = () => {
  return (
    <SpaceWrapper wid={testSpace.wid} hgt={testSpace.hgt}>
      <SpaceContent></SpaceContent>
    </SpaceWrapper>
  )
}

export default Space

'use client'

import BlockWrapper from '../BlockWrapper'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
}

const TestBlock = (props: Props) => {
  return (
    <BlockWrapper {...props}>
      <p>test block!</p>
    </BlockWrapper>
  )
}

export default TestBlock

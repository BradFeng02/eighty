'use client'

import { useState } from 'react'
import BlockWrapper from '../BlockWrapper'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
}

const TestBlock = (props: Props) => {
  const [val, setVal] = useState(0)

  return (
    <BlockWrapper {...props}>
      <span>test block! val: {val}</span>
      <button
        className="inline-block bg-white active:bg-gray-400"
        onClick={() => {
          console.log('press')

          setVal(val + 1)
        }}
      >
        count
      </button>
      <div className="scrollable h-1/2 w-5/6 overflow-scroll bg-amber-200">
        <textarea
          className="scrollable m-2 h-32 w-16"
          defaultValue="edit me"
        ></textarea>
      </div>
    </BlockWrapper>
  )
}

export default TestBlock

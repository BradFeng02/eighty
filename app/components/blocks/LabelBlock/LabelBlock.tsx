'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import BlockWrapper from '../BlockWrapper'
import { BLOCK_PADDING } from '../../Space/constants'
import { ok } from 'assert'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
}

const placeholder = '👇 Daily Tasks'

const LabelBlock = (props: Props) => {
  const heading = useRef<HTMLHeadingElement>(null)
  const [val, setVal] = useState(placeholder)
  const [targetFontSize, setTargetFontSize] = useState(24)
  const [fontScale, setFontScale] = useState(1)

  useEffect(() => {
    if (heading.current) heading.current.textContent = placeholder
  }, [])

  const inputHandler = (e: FormEvent) => {
    setVal(e.currentTarget.textContent || '')
    if (e.currentTarget.parentElement) {
      setFontScale(
        Math.min(
          1,
          (e.currentTarget.parentElement.clientWidth - 1) /
            ((e.currentTarget.scrollWidth + 1) / fontScale),
          (e.currentTarget.parentElement.clientHeight - 1) /
            ((e.currentTarget.scrollHeight + 1) / fontScale)
        )
      )
    }
  }

  const syncValue = () => {
    if (heading.current) heading.current.textContent = val
  }

  

  return (
    <BlockWrapper {...props}>
      <div className=" flex h-full w-full items-center justify-center">
        <h1
          ref={heading}
          contentEditable="true"
          style={{
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflow: 'clip',
            fontSize: targetFontSize * fontScale + 'px',
            lineHeight: targetFontSize * 1.3 * fontScale + 'px',
          }}
          className="inline-block font-bold"
          onInput={inputHandler}
          onBlur={syncValue}
        ></h1>
      </div>
    </BlockWrapper>
  )
}

export default LabelBlock

'use client'

import { useEffect, useMemo, useState } from 'react'
import BlockWrapper from '../BlockWrapper'
import {
  commandBarItems,
  useCommandBar,
} from '../../CommandBar/CommandBarContext'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
}

const TestBlock = (props: Props) => {
  const [test, setTest] = useState('value!')
  const [blah, setBlah] = useState(0)

  const commands = useMemo(
    () =>
      commandBarItems(
        <p>{test.length}</p>,
        <button onClick={() => setTest((v) => v + '!!')}>
          test button: {test}
        </button>
      ),
    [test]
  )
  const bindToolbar = useCommandBar(commands)

  const outercommnds = useMemo(
    () =>
      commandBarItems(
        <p>block lvl!</p>,
        <button onClick={() => setTest('value!')}>reset: {test.length}</button>
      ),
    [test]
  )
  const bindoutertb = useCommandBar(outercommnds)

  return (
    <BlockWrapper {...props} onClick={bindoutertb}>
      <p
        onClick={() => {
          bindToolbar()
          // setBlah(blah + 1)
        }}
      >
        test block!
      </p>
    </BlockWrapper>
  )
}

export default TestBlock

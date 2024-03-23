'use client'

import { useEffect, useMemo, useState } from 'react'
import BlockWrapper from '../BlockWrapper'
import { itemList, useCommandBar } from '../../CommandBar/CommandBarContext'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
}

const TestBlock = (props: Props) => {
  const [bindItems, updateItems] = useCommandBar(111)
  const [test, setTest] = useState('value!')
  const [blah, setBlah] = useState(0)

  const commands = useMemo(
    () =>
      itemList(
        <p>{test.length}</p>,
        <button onClick={() => setTest((v) => v + '!!')}>
          test button: {test}
        </button>
      ),
    [test]
  )

  useEffect(() => {
    updateItems(commands)
  }, [updateItems, commands])

  return (
    <BlockWrapper {...props}>
      <p
        onClick={() => {
          bindItems(commands)
          // setBlah(blah + 1)
        }}
      >
        test block!
      </p>
    </BlockWrapper>
  )
}

export default TestBlock

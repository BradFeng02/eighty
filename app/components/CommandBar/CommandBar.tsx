'use client'

import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { CommandBarContext } from './CommandBarContext'
import styles from './CommandBar.module.css'

const CommandBar = () => {
  const context = useContext(CommandBarContext)
  const [items, setItems] = useState<ReactNode[][]>([])
  const [update, setUpdate] = useState<number>(0) // trigger rerender

  useEffect(() => {
    context.setUpdate((items) => {
      setItems(items)
      setUpdate((u) => u + 1)
    })
  }, [context])

  const entries = useMemo(() => {
    const numLevels = items.length
    return items.flatMap((level, i) => {
      const levelEntries = level.map((item, j) => (
        <div className="bg-gray-300 p-2" key={`${i}-${j}`}>
          {item}
        </div>
      ))
      if (i < numLevels - 1)
        levelEntries.push(
          <div className={`${styles['eighty-tb-sep']}`} key={`${i}-sep`}>
            &nbsp;
          </div>
        )
      return levelEntries
    })
  }, [items, update]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="flex h-12 w-full gap-2 bg-gray-200 p-2">{entries}</div>
}

export default CommandBar

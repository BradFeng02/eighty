'use client'

import React, { ReactNode, useContext, useEffect, useState } from 'react'
import { CommandBarContext } from './CommandBarContext'

const CommandBar = () => {
  const context = useContext(CommandBarContext)
  const [items, setItems] = useState<ReactNode[]>([])

  useEffect(() => {
    context.setUpdate(setItems)
  }, [context])

  return (
    <div className="flex h-12 w-full gap-2 bg-orange-900 p-2">
      {items.map((item, i) => (
        <div className="bg-green-800 p-2" key={i}>
          {item}
        </div>
      ))}
    </div>
  )
}

export default CommandBar

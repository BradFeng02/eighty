'use client'

import { useMemo } from 'react'
import CommandBar from '../CommandBar/CommandBar'
import {
  CommandBarContext,
  CommandBarObject,
} from '../CommandBar/CommandBarContext'
import Space from '../Space/Space'

const EightyEditor = () => {
  const commandBarContext = useMemo(() => new CommandBarObject(), [])
  return (
    <CommandBarContext.Provider value={commandBarContext}>
      <div
        className={`flex h-full w-full flex-col border-8 border-solid border-black`}
      >
        <CommandBar></CommandBar>
        <div className="flex-grow">
          <Space></Space>
        </div>
      </div>
    </CommandBarContext.Provider>
  )
}

export default EightyEditor

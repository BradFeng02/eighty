'use client'

import { useState, useMemo, useRef } from 'react'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { EditorThemeClasses } from 'lexical'
import BlockWrapper from '../BlockWrapper'
import TodoList from './TodoList'
import RichLexical, {
  InitialConfigReduced,
} from '../../RichLexical/RichLexical'
import ScrollableDiv from '../../Space/ScrollableDiv'
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

const titleTheme: EditorThemeClasses = {
  heading: {
    h2: 'h-min',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

const initConfig: InitialConfigReduced = {
  theme: titleTheme,
  nodes: [HeadingNode],
}
const $defaultNode = () => $createHeadingNode('h2')

const TodoListBlock = (props: Props) => {
  const [showTitle, setShowTitle] = useState(true)
  const [titleFontSize, setTitleFontSize] = useState(16)
  const [listScrollable, setListScrollable] = useState(false)
  const submitRef = useRef<() => void>()

  const commands = useMemo(
    () =>
      commandBarItems(
        <button
          onClick={() => {
            console.log('submit from bar') // @TODO
            submitRef.current?.()
          }}
        >
          submit test
        </button>
      ),
    []
  )
  const bindToolbar = useCommandBar(commands)

  return (
    <BlockWrapper {...props} onClick={() => bindToolbar()}>
      <div className="flex h-full flex-col gap-[10px]">
        {showTitle && (
          <RichLexical
            namespace="TodoListBlock"
            initConfig={initConfig}
            $defaultNodeType={$defaultNode}
            fontSize={titleFontSize + 'px'}
            placeholder="Title"
            singleLine
            singleParagraph
          >
            <HistoryPlugin />
          </RichLexical>
        )}
        <ScrollableDiv
          className="flex-grow border-t-2 border-white pt-[5px]"
          scrollableY={listScrollable}
        >
          <TodoList setScrollable={setListScrollable} submitRef={submitRef} />
        </ScrollableDiv>
      </div>
    </BlockWrapper>
  )
}

export default TodoListBlock

'use client'

import { useState } from 'react'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { EditorThemeClasses } from 'lexical'
import BlockWrapper from '../BlockWrapper'
import TodoList from './TodoList'
import RichLexical, {
  InitialConfigReduced,
} from '../../RichLexical/RichLexical'

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

  return (
    <BlockWrapper {...props}>
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
        <TodoList />
      </div>
    </BlockWrapper>
  )
}

export default TodoListBlock

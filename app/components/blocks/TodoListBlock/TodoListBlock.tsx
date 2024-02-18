'use client'

import { useState } from 'react'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import {
  $getRoot,
  $selectAll,
  EditorThemeClasses,
  ParagraphNode,
} from 'lexical'
import BlockWrapper from '../BlockWrapper'
import TodoList from './TodoList'
import RichLexical, {
  CustomInitializeState,
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

const TodoListBlock = (props: Props) => {
  const [showTitle, setShowTitle] = useState(true)
  const [titleFontSize, setTitleFontSize] = useState(16)

  const initState: CustomInitializeState = (editor, register) => {
    const heading = $createHeadingNode('h2')
    $getRoot().append(heading)
    $selectAll()

    // no delete h2
    editor.registerNodeTransform(ParagraphNode, (node) => {
      const heading = $createHeadingNode('h2')
      node.replace(heading)
    })
  }

  return (
    <BlockWrapper {...props}>
      <div className="flex h-full flex-col gap-[10px]">
        {showTitle && (
          <RichLexical
            namespace="TodoListBlock"
            initConfig={initConfig}
            customInitState={initState}
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

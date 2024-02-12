'use client'

import { useEffect, useRef, useState } from 'react'
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import {
  $getRoot,
  $getSelection,
  $selectAll,
  COMMAND_PRIORITY_EDITOR,
  EditorThemeClasses,
  FORMAT_TEXT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  LexicalEditor,
  ParagraphNode,
} from 'lexical'
import BlockWrapper from '../BlockWrapper'
import TodoListItem from './TodoListItem'
import TodoList from './TodoList'

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

const TodoListBlock = (props: Props) => {
  const titleEditorRoot = useRef<HTMLElement>()
  const [showTitle, setShowTitle] = useState(true)
  const [titleFontSize, setTitleFontSize] = useState(16)
  const [titlePlaceholder, setTitlePlaceholder] = useState(true)

  const initialEditorState = (editor: LexicalEditor) => {
    const heading = $createHeadingNode('h2')
    $getRoot().append(heading)
    $selectAll()

    // single line
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      (payload: void, editor: LexicalEditor) => {
        editor.blur()
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
    editor.registerCommand(
      INSERT_LINE_BREAK_COMMAND,
      () => true,
      COMMAND_PRIORITY_EDITOR
    )

    // no delete h2
    editor.registerNodeTransform(ParagraphNode, (node) => {
      const heading = $createHeadingNode('h2')
      node.replace(heading)
    })

    // empty
    editor.registerRootListener((rootElement: null | HTMLElement) => {
      if (rootElement) titleEditorRoot.current = rootElement
    })
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const nodes = $getSelection()?.getNodes()
        if (titleEditorRoot.current)
          setTitlePlaceholder(
            !!(nodes && nodes.length == 1 && nodes[0].getType() === 'heading')
          )
      })
    })
  }

  const titleInitialConfig: InitialConfigType = {
    namespace: 'TodoListBlock',
    theme: titleTheme,
    onError: (err) => console.error(`TodoListBlock: Lexical - ${err}`),
    editorState: initialEditorState,
    nodes: [HeadingNode],
  }

  return (
    <BlockWrapper {...props}>
      <div className="flex h-full flex-col" style={{ gap: '10px' }}>
        {showTitle && (
          <div className="relative">
            <LexicalComposer initialConfig={titleInitialConfig}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={`content-editable todolist-block w-full${titlePlaceholder ? ' show-placeholder' : ''}`}
                    style={{
                      fontSize: titleFontSize + 'px',
                    }}
                  />
                }
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
            </LexicalComposer>
          </div>
        )}
        <TodoList />
      </div>
    </BlockWrapper>
  )
}

export default TodoListBlock

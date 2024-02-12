'use client'

import { useRef, useState } from 'react'
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
  LexicalEditor,
  ParagraphNode,
} from 'lexical'
import BlockWrapper from '../BlockWrapper'

type Props = {
  wid: number
  hgt: number
  left: number
  top: number
}

const theme: EditorThemeClasses = {
  heading: {
    h1: 'h-min',
  },
  text: {
    base: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

const LabelBlock = (props: Props) => {
  const block = useRef<HTMLDivElement>(null)
  const editorRoot = useRef<HTMLElement>()
  const [placeholder, setPlaceholder] = useState(true)
  const [fontSize, setFontSize] = useState(24)
  const [squish, setSquish] = useState(1)

  const initialEditorState = (editor: LexicalEditor) => {
    // centered heading
    const heading = $createHeadingNode('h1')
    heading.setFormat('center')
    $getRoot().append(heading)
    $selectAll()

    // single paragraph
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      (payload: void, editor: LexicalEditor) => {
        editor.blur()
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // no bold
    editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (payload: string, editor: LexicalEditor) => {
        return payload === 'bold'
      },
      COMMAND_PRIORITY_EDITOR
    )

    // no delete heading
    editor.registerNodeTransform(ParagraphNode, (node) => {
      const heading = $createHeadingNode('h1')
      heading.setFormat('center')
      node.replace(heading)
    })

    // squish too tall, empty
    editor.registerRootListener((rootElement: null | HTMLElement) => {
      if (rootElement) editorRoot.current = rootElement
    })
    editor.registerUpdateListener(({ editorState }) => {
      // empty
      editorState.read(() => {
        const nodes = $getSelection()?.getNodes()
        if (block.current)
          setPlaceholder(
            !!(nodes && nodes.length == 1 && nodes[0].getType() === 'heading')
          )
      })

      // set squish
      if (editorRoot.current && block.current) {
        setSquish(
          Math.min(
            1,
            block.current.clientHeight / editorRoot.current.clientHeight
          )
        )
      }
    })
  }

  const initialConfig: InitialConfigType = {
    namespace: 'LabelBlock',
    theme,
    onError: (err) => console.error(`LabelBlock: Lexical - ${err}`),
    editorState: initialEditorState,
    nodes: [HeadingNode],
  }

  return (
    <BlockWrapper {...props}>
      <div ref={block} className="flex h-full items-center">
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`content-editable label-block w-full${placeholder ? ' show-placeholder' : ''}`}
                style={{
                  fontSize: fontSize + 'px',
                  scale: `1 ${squish}`,
                }}
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
        </LexicalComposer>
      </div>
    </BlockWrapper>
  )
}

export default LabelBlock

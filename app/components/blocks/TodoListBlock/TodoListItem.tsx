'use client'

import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode } from '@lexical/rich-text'
import {
  $getSelection,
  COMMAND_PRIORITY_EDITOR,
  EditorThemeClasses,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  LexicalEditor,
  EditorState,
  BLUR_COMMAND,
} from 'lexical'
import { eightyTask } from '@/app/datatypes'
import { useRef, useState } from 'react'

type Props = {
  task: eightyTask
}

const theme: EditorThemeClasses = {
  paragraph: 'h-min',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

const TodoListItem = ({ task }: Props) => {
  const fontSize = 16
  const [checked, setChecked] = useState(task.checked)
  const contentRef = useRef<EditorState>()

  const initialEditorState = (editor: LexicalEditor) => {
    const initState = editor.parseEditorState(task.contentState)
    editor.setEditorState(initState)
    contentRef.current = initState

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

    editor.registerCommand(
      BLUR_COMMAND,
      (payload: FocusEvent, editor: LexicalEditor) => {
        const newstate = editor.getEditorState()
        newstate.read(() => {
          const nodes = $getSelection()?.getNodes()
          // if empty
          if (
            nodes &&
            nodes.length == 1 &&
            nodes[0].getType() === 'paragraph'
          ) {
            if (contentRef.current) editor.setEditorState(contentRef.current)
            editor.blur()
          } else {
            // if not same
            if (
              JSON.stringify(contentRef.current) !== JSON.stringify(newstate)
            ) {
              contentRef.current = newstate
              // save new state here
            }
          }
        })

        return false
      },
      COMMAND_PRIORITY_EDITOR
    )
  }

  const initialConfig: InitialConfigType = {
    namespace: 'TodoListItem',
    theme,
    onError: (err) => console.error(`TodoListItem: Lexical - ${err}`),
    editorState: initialEditorState,
    nodes: [HeadingNode],
  }

  return (
    <li className="mb-[5px]">
      <div className="flex items-center gap-[5px]">
        <div className="w-[18px] min-w-[18px]">
          <input
            className="align-middle"
            type="checkbox"
            checked={checked}
            onChange={() => {
              setChecked((c) => !c)
            }}
          ></input>
        </div>

        <div className="relative flex-grow">
          <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={`content-editable w-full`}
                  style={{
                    fontSize: fontSize + 'px',
                    textDecoration: checked ? 'line-through' : undefined,
                    // color: checked ? 'rgba(50, 50, 50, .5)' : undefined,
                    opacity: checked ? 0.6 : undefined,
                  }}
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
          </LexicalComposer>
        </div>
      </div>
    </li>
  )
}

export default TodoListItem

'use client'

import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HeadingNode } from '@lexical/rich-text'
import {
  $getSelection,
  EditorThemeClasses,
  EditorState,
  BLUR_COMMAND,
} from 'lexical'
import { eightyTask } from '@/app/datatypes'
import { useRef, useState } from 'react'
import RichLexical, {
  InitialConfigReduced,
  CustomInitializeState,
} from '../../RichLexical/RichLexical'

type Props = {
  task: eightyTask
}

const TodoListItem = ({ task }: Props) => {
  const fontSize = 16
  const [checked, setChecked] = useState(task.checked)
  const contentRef = useRef<EditorState>()

  const initState: CustomInitializeState = (editor, register) => {
    const initState = editor.parseEditorState(task.contentState)
    editor.setEditorState(initState)
    contentRef.current = initState

    register(BLUR_COMMAND, (editor) => {
      const newstate = editor.getEditorState()
      newstate.read(() => {
        const nodes = $getSelection()?.getNodes()
        // if empty
        if (nodes && nodes.length == 1 && nodes[0].getType() === 'paragraph') {
          if (contentRef.current) editor.setEditorState(contentRef.current)
          editor.blur()
        } else {
          // if not same
          if (JSON.stringify(contentRef.current) !== JSON.stringify(newstate)) {
            contentRef.current = newstate
            // @TODO save new state here
          }
        }
      })
      return false
    })
  }

  const theme: EditorThemeClasses = {
    paragraph: 'h-min',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
    },
  }

  const initialConfig: InitialConfigReduced = {
    theme,
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
          <RichLexical
            namespace="TodoListItem"
            initialConfig={initialConfig}
            customInitState={initState}
            contentStyle={{
              fontSize: fontSize + 'px',
              textDecoration: checked ? 'line-through' : undefined,
              opacity: checked ? 0.6 : undefined,
            }}
            singleLine
            singleParagraph
          >
            <HistoryPlugin />
          </RichLexical>
        </div>
      </div>
    </li>
  )
}

export default TodoListItem

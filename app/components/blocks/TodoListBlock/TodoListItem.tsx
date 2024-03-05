'use client'

import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { EditorThemeClasses, EditorState, BLUR_COMMAND } from 'lexical'
import { eightyTask } from '@/app/datatypes'
import { useRef, useState } from 'react'
import RichLexical, {
  InitialConfigReduced,
  CustomInitializeState,
  $editorIsEmpty,
} from '../../RichLexical/RichLexical'
import { Dbt } from '@/app/utils'

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

const initConfig: InitialConfigReduced = { theme }

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
        // if empty don't update
        if ($editorIsEmpty()) {
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

  return (
    <li className="mb-[5px]">
      <div className="flex items-center gap-[5px]">
        <div className="w-[18px] min-w-[18px]">
          <input
            className={`${Dbt.Toggle} align-middle`}
            type="checkbox"
            checked={checked}
            onChange={() => {
              setChecked((c) => !c)
            }}
          ></input>
        </div>

        <RichLexical
          containerClass="flex-grow"
          namespace="TodoListItem"
          initConfig={initConfig}
          customInitState={initState}
          fontSize={fontSize + 'px'}
          contentStyle={{
            textDecoration: checked ? 'line-through' : undefined,
            opacity: checked ? 0.6 : undefined,
          }}
          singleLine
          singleParagraph
          hideEmptyLine
        >
          <HistoryPlugin />
        </RichLexical>
      </div>
    </li>
  )
}

export default TodoListItem

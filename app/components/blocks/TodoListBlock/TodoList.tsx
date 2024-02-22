'use client'

import { useEffect, useRef, useState } from 'react'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import {
  $getRoot,
  $selectAll,
  EditorThemeClasses,
  INSERT_PARAGRAPH_COMMAND,
  LexicalEditor,
  $setSelection,
} from 'lexical'
import TodoListItem from './TodoListItem'
import { eightyTask, newEightyTask } from '@/app/datatypes'
import { PlusIcon } from '@/app/icons'
import RichLexical, {
  $editorIsEmpty,
  CustomInitializeState,
  InitialConfigReduced,
} from '../../RichLexical/RichLexical'

const theme: EditorThemeClasses = {
  paragraph: 'h-min',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

const initConfig: InitialConfigReduced = { theme }

const TodoList = () => {
  const editorRef = useRef<LexicalEditor>(null)
  const insertFontSize = 16
  const [empty, setEmpty] = useState(true)
  const [tasks, setTasks] = useState<eightyTask[]>([])

  const isLoaded = useRef<boolean>(false)
  useEffect(() => {
    isLoaded.current = true
    return () => {
      isLoaded.current = false
    }
  }, [])

  const initState: CustomInitializeState = (editor, register) => {
    // empty
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (isLoaded.current) setEmpty($editorIsEmpty())
      })
    })
  }

  const onSubmitTask = (editor: LexicalEditor) => {
    let submit = false
    editor.getEditorState().read(() => {
      // submit if not empty
      submit = !$editorIsEmpty() // NO LONGER TRIMS
    })
    if (submit) {
      const editorStateString = JSON.stringify(editor.getEditorState())
      setTasks((t) => [...t, newEightyTask(editorStateString)])
      // clear and reset formatting
      editor.update(() => {
        const r = $getRoot()
        r.clear()
        $setSelection(null)
        $selectAll()
      })
    } else {
      editor.focus()
    }
  }

  return (
    <div className="scrollable flex-grow overflow-scroll border-t-2 border-white pt-[5px]">
      <ol>
        {tasks.map((t, i) => (
          <TodoListItem task={t} key={i} />
        ))}
      </ol>
      <div className="flex items-center gap-[5px]">
        <div
          className="w-[18px] min-w-[18px] select-none"
          style={{ opacity: empty ? 0.35 : 1 }}
          onClick={() => {
            editorRef.current?.dispatchCommand(
              INSERT_PARAGRAPH_COMMAND,
              undefined
            )
          }}
        >
          <div className="h-[15px] w-[15px] text-black">{PlusIcon}</div>
        </div>
        <RichLexical
          containerClass="flex-grow"
          namespace="TodoListInsert"
          initConfig={initConfig}
          customInitState={initState}
          placeholder="New task"
          hideEmptyLine
          fontSize={insertFontSize + 'px'}
          singleLine
          singleParagraph
          onSubmit={onSubmitTask}
        >
          <HistoryPlugin />
          <EditorRefPlugin editorRef={editorRef} />
        </RichLexical>
      </div>
    </div>
  )
}

export default TodoList

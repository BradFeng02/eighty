'use client'

import { useEffect, useRef, useState } from 'react'
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
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
  $createParagraphNode,
  $setSelection,
} from 'lexical'
import TodoListItem from './TodoListItem'
import styles from './TodoList.module.css'
import { eightyTask, newEightyTask } from '@/app/datatypes'

const theme: EditorThemeClasses = {
  paragraph: 'h-min',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

const TodoList = () => {
  const editorRoot = useRef<HTMLElement>()
  const editorRef = useRef<LexicalEditor>(null)
  const insertFontSize = 16
  const [insertPlaceholder, setinsertPlaceholder] = useState(true)
  const [tasks, setTasks] = useState<eightyTask[]>([])

  const initialEditorState = (editor: LexicalEditor) => {
    const p = $createParagraphNode()
    $getRoot().append(p)
    $selectAll()

    // submit task, single line
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      (payload: void, editor: LexicalEditor) => {
        let submit = false
        editor.getEditorState().read(() => {
          const test = $getRoot().getChildren()
          submit =
            test.length == 1 && test[0].getTextContent().trim().length > 0
        })
        if (submit) {
          submitTask(JSON.stringify(editor.getEditorState()))
          editor.update(() => {
            const r = $getRoot()
            r.clear()
            const p = $createParagraphNode()
            r.append(p)
            $setSelection(null)
            $selectAll()
          })
        }
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
    editor.registerCommand(
      INSERT_LINE_BREAK_COMMAND,
      () => true,
      COMMAND_PRIORITY_EDITOR
    )

    // empty
    editor.registerRootListener((rootElement: null | HTMLElement) => {
      if (rootElement) editorRoot.current = rootElement
    })
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const nodes = $getSelection()?.getNodes()
        if (editorRoot.current)
          setinsertPlaceholder(
            !!(nodes && nodes.length == 1 && nodes[0].getType() === 'paragraph')
          )
      })
    })
  }

  const initialConfig: InitialConfigType = {
    namespace: 'TodoListInsert',
    theme,
    onError: (err) => console.error(`TodoListInsert: Lexical - ${err}`),
    editorState: initialEditorState,
    nodes: [HeadingNode],
  }

  const submitTask = (editorStateString: string) => {
    setTasks((t) => [...t, newEightyTask(editorStateString)])
  }

  return (
    <div className="scrollable flex-grow overflow-scroll border-t-2 border-white pt-[5px]">
      <ol>
        {tasks.map((t, i) => (
          <TodoListItem task={t} key={i} />
        ))}
      </ol>
      <div className="flex gap-[5px]">
        <div
          className="w-[18px] select-none"
          style={{ opacity: insertPlaceholder ? 0.5 : 1 }}
          onClick={() => {
            editorRef.current?.dispatchCommand(
              INSERT_PARAGRAPH_COMMAND,
              undefined
            )
          }}
        >
          +
        </div>
        <div className="relative flex-grow">
          <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={`content-editable todolist-insert w-full${insertPlaceholder ? ' show-placeholder' : ''}`}
                  style={{
                    fontSize: insertFontSize + 'px',
                  }}
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <EditorRefPlugin editorRef={editorRef} />
          </LexicalComposer>
        </div>
      </div>
    </div>
  )
}

export default TodoList

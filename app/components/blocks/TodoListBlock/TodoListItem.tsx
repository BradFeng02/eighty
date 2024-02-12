'use client'

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
} from 'lexical'
import { eightyTask } from '@/app/datatypes'

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

  const initialEditorState = (editor: LexicalEditor) => {
    // const p = $createParagraphNode()
    // $getRoot().append(p)
    // $selectAll()
    editor.setEditorState(editor.parseEditorState(task.contentState))

    // submit task, single line
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

    // empty
    // editor.registerRootListener((rootElement: null | HTMLElement) => {
    //   if (rootElement) editorRoot.current = rootElement
    // })
    // editor.registerUpdateListener(({ editorState }) => {
    //   editorState.read(() => {
    //     const nodes = $getSelection()?.getNodes()
    //     if (editorRoot.current)
    //       setinsertPlaceholder(
    //         !!(nodes && nodes.length == 1 && nodes[0].getType() === 'paragraph')
    //       )
    //   })
    // })
  }

  const initialConfig: InitialConfigType = {
    namespace: 'TodoListItem',
    theme,
    onError: (err) => console.error(`TodoListItem: Lexical - ${err}`),
    editorState: initialEditorState,
    nodes: [HeadingNode],
  }

  return (
    <li
      style={{
        marginBottom: '5px',
      }}
    >
      <div className="flex items-center" style={{ gap: '5px' }}>
        <div className="" style={{ width: '18px' }}>
          <input
            className="align-middle"
            type="checkbox"
            defaultChecked={task.checked}
          ></input>
        </div>

        <div className="relative flex-grow">
          <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={`content-editable todolist-insert w-full`}
                  style={{
                    fontSize: fontSize + 'px',
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

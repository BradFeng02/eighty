import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import {
  COMMAND_PRIORITY_EDITOR,
  EditorThemeClasses,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  LexicalEditor,
  HTMLConfig,
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  $getRoot,
  LexicalCommand,
  CommandListenerPriority,
} from 'lexical'
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'

export type InitialConfigReduced = {
  nodes?: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>
  onError?: (error: Error, editor: LexicalEditor) => void
  editable?: boolean
  theme?: EditorThemeClasses
  html?: HTMLConfig
}

export type RegisterCommand = <P>(
  command: LexicalCommand<P>,
  listener: (editor: LexicalEditor, payload: P) => boolean,
  priority?: CommandListenerPriority
) => void

export type CustomInitializeState = (
  editor: LexicalEditor,
  register: RegisterCommand
) => void

type Props = {
  namespace: string
  placeholder?: string
  initConfig: InitialConfigReduced
  customInitState?: CustomInitializeState
  contentStyle?: CSSProperties
  singleLine?: boolean
  singleParagraph?: boolean
  onSubmit?: (editor: LexicalEditor) => void
  children: ReactNode
}

const RichLexical = ({
  namespace,
  placeholder,
  initConfig,
  customInitState,
  contentStyle,
  singleLine = false,
  singleParagraph = false,
  onSubmit,
  children,
}: Props) => {
  const [showPlaceholder, setShowPlaceholder] = useState(!!placeholder)

  // editor loaded (sometimes error setting show placeholder)
  const editorLoaded = useRef<boolean>(false)
  useEffect(() => {
    editorLoaded.current = true
    return () => {
      editorLoaded.current = false
    }
  }, [])

  // lexical initial editor state
  const initialEditorState = (editor: LexicalEditor) => {
    // custom initial config code, with register command helper
    customInitState?.(
      editor,
      (command, listener, priority = COMMAND_PRIORITY_EDITOR) => {
        editor.registerCommand(
          command,
          (payload, editor) => listener(editor, payload),
          priority
        )
      }
    )

    // single paragraph / submit + single line
    if (singleParagraph) {
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        (payload: void, editor: LexicalEditor) => {
          editor.blur()
          onSubmit?.(editor)
          return true
        },
        COMMAND_PRIORITY_EDITOR
      )
    }
    if (singleLine) {
      editor.registerCommand(
        INSERT_LINE_BREAK_COMMAND,
        () => true,
        COMMAND_PRIORITY_EDITOR
      )
    }

    // empty placeholder
    if (placeholder) {
      editor.registerUpdateListener(({ editorState }) => {
        if (editorLoaded.current)
          editorState.read(() => {
            const empty = !$getRoot().getTextContentSize()
            setShowPlaceholder(empty)
          })
      })
    }
    /////
  }

  const initialConfig: InitialConfigType = {
    namespace,
    onError: (err) => console.error(`${namespace}: Lexical - ${err}`),
    editorState: initialEditorState,
    ...initConfig,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={`content-editable todolist-block w-full${showPlaceholder ? ' show-placeholder' : ''}`}
            style={contentStyle}
          />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      {children}
    </LexicalComposer>
  )
}

export default RichLexical

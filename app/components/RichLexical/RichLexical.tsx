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
  BLUR_COMMAND,
  ElementNode,
  $setSelection,
  ParagraphNode,
} from 'lexical'
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'
import styles from './RichLexical.module.css'

interface VarStyle extends CSSProperties {
  '--placeholder-text': string
}

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

export const $editorIsEmpty = () => {
  return !$getRoot().getTextContentSize()
}

type Props = {
  namespace: string
  placeholder?: string
  hideEmptyLine?: boolean
  initConfig: InitialConfigReduced
  $defaultNodeType?: () => ElementNode
  customInitState?: CustomInitializeState
  fontSize?: string
  contentStyle?: CSSProperties
  singleLine?: boolean
  singleParagraph?: boolean
  onSubmit?: (editor: LexicalEditor) => void
  placeholderClass?: string
  containerClass?: string
  contentClass?: string
  children: ReactNode
}

const RichLexical = ({
  namespace,
  placeholder,
  hideEmptyLine = false,
  initConfig,
  $defaultNodeType,
  customInitState,
  fontSize = 'inherit',
  contentStyle,
  singleLine = false,
  singleParagraph = false,
  onSubmit,
  placeholderClass = '',
  containerClass = '',
  contentClass = '',
  children,
}: Props) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const initialShow = useRef<boolean>(false)

  // editor loaded (sometimes error setting show placeholder)
  const editorLoaded = useRef<boolean>(false)
  useEffect(() => {
    const initShow = initialShow.current
    setShowPlaceholder(initShow)
    initialShow.current = false
    editorLoaded.current = true
    return () => {
      initialShow.current = initShow
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
          if (onSubmit) onSubmit(editor)
          else editor.blur()
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

    // empty placeholder line or text
    if (!hideEmptyLine || placeholder) {
      // show if empty
      const editorSetShow = (editor: LexicalEditor) => {
        editor.getEditorState().read(() => {
          const empty = $editorIsEmpty()
          if (editorLoaded.current) setShowPlaceholder(empty)
          else initialShow.current = empty
        })
      }
      // initial check
      editorSetShow(editor)
      // check on blur
      editor.registerCommand(
        BLUR_COMMAND,
        (_, editor) => {
          editorSetShow(editor)
          return false
        },
        COMMAND_PRIORITY_EDITOR
      )
    }

    // default node type
    if ($defaultNodeType) {
      // replace default paragraph node
      editor.registerNodeTransform(ParagraphNode, (node) => {
        node.replace($defaultNodeType(), true)
      })
      // clear on blur if empty
      editor.registerCommand(
        BLUR_COMMAND,
        (_, editor) => {
          editor.update(() => {
            if ($editorIsEmpty() && $getRoot().getChildren().length === 1) {
              $getRoot().clear()
              $setSelection(null)
            }
          })
          return false
        },
        COMMAND_PRIORITY_EDITOR
      )
    }
    /////
  }

  const initialConfig: InitialConfigType = {
    namespace,
    onError: (err) => console.error(`${namespace}: Lexical - ${err}`),
    editorState: initialEditorState,
    ...initConfig,
  }

  const show = initialShow.current || showPlaceholder
  const showClass = show ? `${styles.show}` : ''
  const placeholderLineClasses = hideEmptyLine
    ? ''
    : `${styles.placeholderLine} ${showClass}`

  return (
    <div className={`relative ${styles.container} ${containerClass}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={`w-full ${styles.contentEditable} ${contentClass} ${placeholderLineClasses}`}
              style={{ fontSize, ...contentStyle }}
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        {children}
      </LexicalComposer>
      {placeholder && (
        <div
          className={`${placeholderClass} ${styles.placeholderText} ${showClass}`}
          style={{ fontSize }}
        >
          {placeholder}
        </div>
      )}
    </div>
  )
}

export default RichLexical

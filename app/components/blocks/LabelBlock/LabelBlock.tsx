'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import RichLexical, {
  CustomInitializeState,
  InitialConfigReduced,
} from '../../RichLexical/RichLexical'

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

const initConfig: InitialConfigReduced = {
  theme,
  nodes: [HeadingNode],
}
const $defaultNode = () => {
  const heading = $createHeadingNode('h1')
  heading.setFormat('center')
  return heading
}

const LabelBlock = (props: Props) => {
  const block = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(24)

  const squishLabel = () => {
    if (block.current && wrapper.current) {
      const scaleY = Math.min(
        1,
        block.current.clientHeight / wrapper.current.clientHeight
      )
      wrapper.current.style.scale = '1 ' + scaleY
    }
  }

  // squish too tall
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      squishLabel()
    })
    if (wrapper.current) resizeObserver.observe(wrapper.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // layout effect: avoid flicker
  useLayoutEffect(() => squishLabel(), [fontSize])

  const initState: CustomInitializeState = (editor, register) => {
    // no bold
    register(FORMAT_TEXT_COMMAND, (_, payload) => payload === 'bold')
  }

  return (
    <BlockWrapper {...props}>
      <div
        ref={block}
        className="flex h-full w-full items-center overflow-visible"
      >
        <div ref={wrapper} className="w-full">
          <RichLexical
            namespace="LabelBlock"
            initConfig={initConfig}
            $defaultNodeType={$defaultNode}
            customInitState={initState}
            fontSize={fontSize + 'px'}
            placeholder="Label"
            contentClass="text-center"
            placeholderClass="text-center font-bold"
            singleParagraph
          >
            <HistoryPlugin />
          </RichLexical>
        </div>
      </div>
    </BlockWrapper>
  )
}

export default LabelBlock

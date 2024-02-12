'use client'

import { AKHyper } from '@/app/utils'
import TestBlock from '../blocks/TestBlock/TestBlock'
import LabelBlock from '../blocks/LabelBlock/LabelBlock'
import TodoListBlock from '../blocks/TodoListBlock/TodoListBlock'

const SpaceContent = () => {
  return (
    <div
      className={`${AKHyper.className} relative h-full w-full`}
      style={{ lineHeight: 1.3 }}
    >
      <TodoListBlock wid={3} hgt={5} left={1} top={1}></TodoListBlock>
      <LabelBlock wid={4} hgt={1} left={0} top={0}></LabelBlock>
      <TestBlock wid={1} hgt={2} left={0} top={1}></TestBlock>
    </div>
  )
}

export default SpaceContent

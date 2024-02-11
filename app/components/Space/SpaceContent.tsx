'use client'

import TestBlock from '../blocks/TestBlock/TestBlock'
import LabelBlock from '../blocks/LabelBlock/LabelBlock'
import { AKHyper } from '@/app/utils'

const SpaceContent = () => {
  return (
    <div className={`${AKHyper.className} relative h-full w-full`}>
      <TestBlock wid={3} hgt={2} left={1} top={1}></TestBlock>
      <LabelBlock wid={4} hgt={1} left={0} top={0}></LabelBlock>
      <TestBlock wid={1} hgt={2} left={0} top={1}></TestBlock>
    </div>
  )
}

export default SpaceContent

export type eightyTask = {
  contentState: string
  checked: boolean
  subtasksState?: string
}

export const newEightyTask = (
  contentState: string,
  checked: boolean = false,
  subtasksState: string | undefined = undefined
): eightyTask => {
  return {
    contentState,
    checked,
    subtasksState,
  }
}

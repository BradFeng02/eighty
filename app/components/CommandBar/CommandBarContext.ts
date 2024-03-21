import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

export class CommandBarObject {
  constructor() {}

  private update: (items: ReactNode[]) => void = () =>
    console.error('no update function set for command bar context')
  /**
   * (must call in command bar)
   * @param update called with updated items
   */
  readonly setUpdate = (update: (items: ReactNode[]) => void) => {
    this.update = update
  }

  ///// component functions

  private active?: string
  private unbind: () => void = () => {}

  /**
   * expose items in the command bar
   * @param name name of the component
   * @param unbind function called when control is lost
   * @param items items to show in the command bar (buttons, etc.)
   */
  readonly bind = (name: string, unbind: () => void, items: ReactNode[]) => {
    if (name !== this.active) {
      this.unbind()
      this.active = name
      this.unbind = unbind
    }
    this.update(items)
  }

  /**
   * unbind items from the command bar
   * @param name name of the component. Leave empty to clear any.
   */
  readonly clear = (name?: string) => {
    if (
      this.active !== undefined &&
      (name === undefined || name === this.active)
    ) {
      this.unbind()
      this.active = undefined
      this.unbind = () => {}
      this.update([])
    }
  }

  /**
   * update items in the command bar
   * @param name name of the component
   * @param items items to show in the command bar (buttons, etc.)
   */
  readonly updateItems = (name: string, items: ReactNode[]) => {
    if (name === this.active) this.update(items)
    else console.warn('command bar (update): name was not active')
  }
}

export const CommandBarContext = createContext(new CommandBarObject())

type ItemsFn = (items: ReactNode[]) => void

// workaround to array definition needing key prop
export const itemList = (...items: ReactNode[]) => items

/**
 * @param name name of the component
 */
export const useCommandBar = (name: string): [ItemsFn, ItemsFn] => {
  const toolbar = useContext(CommandBarContext)
  const [active, setActive] = useState(false)
  /**
   * expose arguments as items in the command bar
   * @param items new items to show in the command bar (buttons, etc.)
   */
  const bindItems = (items: ReactNode[]) => {
    setActive(true)
    toolbar.bind(name, () => setActive(false), items)
  }
  /**
   * update items in the command bar
   * @param items updated items to show in the command bar (buttons, etc.)
   */
  const updateItems = (items: ReactNode[]) => {
    if (active) toolbar.updateItems(name, items)
  }

  ///// clear items when unmounting
  // track ref of command bar obj and name
  const ref = useRef<[CommandBarObject, string]>()
  // update ref
  useEffect(() => {
    ref.current = [toolbar, name]
  }, [toolbar, name])
  // clear toolbar on unmount
  useEffect(() => {
    return () => {
      if (ref.current === undefined) return
      const [_toolbar, _name] = ref.current
      _toolbar.clear(_name)
    }
  }, [])

  return [bindItems, updateItems]
}

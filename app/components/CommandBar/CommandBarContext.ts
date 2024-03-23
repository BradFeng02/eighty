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

  private active?: number
  private unbind: () => void = () => {}

  /**
   * expose items in the command bar
   * @param id unique id of the component
   * @param unbind function called when control is lost
   * @param items items to show in the command bar (buttons, etc.)
   */
  readonly bind = (id: number, unbind: () => void, items: ReactNode[]) => {
    if (id !== this.active) {
      this.unbind()
      this.active = id
      this.unbind = unbind
    }
    this.update(items)
  }

  /**
   * unbind items from the command bar
   * @param id unique id of the component. Leave empty to clear any.
   */
  readonly clear = (id?: number) => {
    if (this.active !== undefined && (id === undefined || id === this.active)) {
      this.unbind()
      this.active = undefined
      this.unbind = () => {}
      this.update([])
    }
  }

  /**
   * update items in the command bar
   * @param id unique id of the component
   * @param items items to show in the command bar (buttons, etc.)
   */
  readonly updateItems = (id: number, items: ReactNode[]) => {
    if (id === this.active) this.update(items)
    else console.warn('command bar (update): id was not active')
  }
}

export const CommandBarContext = createContext(new CommandBarObject())

type ItemsFn = (items: ReactNode[]) => void

/**
 * workaround to array definition needing key prop
 * @param items elements to show in command bar
 * @returns arguments as a list of elements
 */
export const commandBarItems = (...items: ReactNode[]) => items

/**
 * provide a function to expose items in the command bar
 * @param id unique id of the component
 * @param items items to show in the command bar (useMemo)
 * @returns function to bind command bar and expose items
 */
export const useCommandBar = (id: number, items: ReactNode[]) => {
  const toolbar = useContext(CommandBarContext)
  const [active, setActive] = useState(false)

  // bind (first time)
  const bind = () => {
    setActive(true)
    toolbar.bind(id, () => setActive(false), items)
  }

  // update (state change)
  useEffect(() => {
    if (active) toolbar.updateItems(id, items)
  }, [active, id, toolbar, items])

  ///// clear items when unmounting
  // track ref of command bar obj and id
  const ref = useRef<[CommandBarObject, number]>()
  // update ref
  useEffect(() => {
    ref.current = [toolbar, id]
  }, [toolbar, id])
  // clear toolbar on unmount
  useEffect(() => {
    return () => {
      if (ref.current === undefined) return
      const [_toolbar, _id] = ref.current
      _toolbar.clear(_id)
    }
  }, [])

  return bind
}

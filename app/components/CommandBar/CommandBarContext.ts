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

  private updateFn: (items: ReactNode[][]) => void = () =>
    console.error('no update function set for command bar context')
  /**
   * (Must call in command bar.)
   * @param update called with updated items
   */
  readonly setUpdate = (update: (items: ReactNode[][]) => void) => {
    this.updateFn = update
  }

  private readonly itemsArray: Array<ReactNode[]> = new Array<ReactNode[]>()
  /**
   * Update the command bar with updated items.
   */
  private readonly update = () => {
    this.updateFn(this.itemsArray)
  }

  // Binding (click event propagation) complete.
  private complete: boolean = true
  // Incrementing ID for each time binding.
  private id: number = 0
  /**
   * Complete binding, updating the command bar.
   * (Must be called in a click event handler for editor root!)
   */
  readonly completeBind = () => {
    this.complete = true
    this.update()
  }
  /**
   * Start binding.
   */
  readonly startBind = () => {
    this.complete = false
    this.id += 1
    this.clearAll()
  }

  private readonly unbindFns: Array<() => void> = new Array<() => void>()
  private readonly unbindAll = () => {
    this.unbindFns.forEach((fn) => fn())
    this.unbindFns.length = 0 // clear
  }

  /**
   * Unbind and clear all items.
   * Does *not* update the command bar.
   */
  private readonly clearAll = () => {
    this.unbindAll()
    this.itemsArray.length = 0 // clear
  }

  ///// functions /////

  /**
   * Expose items in the command bar.
   * @param unbind function called when control is lost
   * @param items items to show in the command bar (buttons, etc.)
   * @returns [bind ID, toolbar level]
   */
  readonly bind = (
    unbind: () => void,
    items: ReactNode[]
  ): [number, number] => {
    if (this.complete) this.startBind()
    this.unbindFns.push(unbind) // append
    const level = this.itemsArray.unshift(items) // prepend
    return [this.id, level] // level is 1 for inner-most commands
  }

  /**
   * update items in the command bar
   * @param id bind ID
   * @param level toolbar level
   * @param items items to show in the command bar (buttons, etc.)
   */
  readonly updateItems = (id: number, level: number, items: ReactNode[]) => {
    if (id === this.id) {
      this.itemsArray[this.itemsArray.length - level] = items
      this.update()
    } else console.warn('command bar (update items): id was not active')
  }

  /**
   * Unbind and clear all items from the command bar.
   * @param id bind ID
   */
  readonly clear = (id?: number) => {
    if (id === undefined || id === this.id) {
      this.clearAll()
      this.completeBind() // just in case complete should be set?
      this.id += 1
    }
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
export const useCommandBar = (items: ReactNode[]) => {
  const toolbar = useContext(CommandBarContext)
  const [active, setActive] = useState(false)
  const [id, setId] = useState(-1)
  const [level, setLevel] = useState(0)
  const [update, setUpdate] = useState(true) // should update

  // bind (first time)
  const bind = () => {
    const [_id, _level] = toolbar.bind(() => setActive(false), items)
    setActive(true)
    setId(_id)
    setLevel(_level)
    setUpdate(false)
  }

  // update (state change)
  useEffect(() => {
    if (active && update) toolbar.updateItems(id, level, items)
    setUpdate(true)
  }, [active, id, level, toolbar, items, update])

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

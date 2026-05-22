// Type declarations for slate and related packages (not installed as full deps)
declare module 'slate' {
  export function createEditor(): any
  export type Descendant = any
  export type BaseEditor = any
  export type Element = any
  export type Node = any
  export type Text = any
  export type Editor = any
  export type Transforms = any
  export const Transforms: any
  export const Editor: any
  export const Node: any
  export const Element: any
  export const Text: any
  export const Range: any
}

declare module 'slate-react' {
  export function withReact(editor: any): any
  export const Slate: any
  export const Editable: any
  export const ReactEditor: any
  export const RenderElementProps: any
  export const RenderLeafProps: any
  export type RenderElementProps = any
  export type RenderLeafProps = any
}

declare module 'slate-history' {
  export function withHistory(editor: any): any
}

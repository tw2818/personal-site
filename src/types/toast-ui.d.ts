declare module '@toast-ui/editor' {
  export class Editor {
    constructor(options: any)
    getMarkdown(): string
    setMarkdown(content: string): void
    on(event: string, handler: () => void): void
    destroy(): void
    getEl(): HTMLElement
  }
}

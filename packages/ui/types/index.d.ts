// Type declarations for the ZhaoUI drop-in build. ZhaoUI is a browser global (window.ZhaoUI) that the script creates; importing the
// package (`import '@zhaoui/ui'`) or adding `/// <reference types="@zhaoui/ui" />` makes these types available.
export {};

type ElementOrSelector = Element | string;
type Mark = 'success' | 'info' | 'warning' | 'error';

interface DialogOptions { title?: string; content?: string | Node; ok?: string; cancel?: string | false; danger?: boolean; backdropClose?: boolean }
interface MessageOptions { type?: Mark; duration?: number }
interface ThemeOptions { audience?: 'b' | 'c'; mode?: 'light' | 'dark'; density?: 'compact' | 'standard' | 'comfortable'; style?: 'flat' | 'glass'; trend?: 'cn' | 'intl' }
interface ComponentDef { selector: string; init(el: Element): void }

interface SelectOption { value: string; label: string; desc?: string; icon?: string; keys?: string; disabled?: boolean }
interface SelectGroup { label: string; options: SelectOption[] }
type SelectItems = Array<SelectOption | SelectGroup>;
interface SelectConfig {
  options?: SelectItems; value?: string | string[] | null; multiple?: boolean; searchable?: boolean; clearable?: boolean; size?: 'sm' | 'md' | 'lg';
  placeholder?: string; emptyText?: string; maxTags?: number; prefixIcon?: string; disabled?: boolean; invalid?: boolean; labelledby?: string;
  freeText?: boolean; chevron?: boolean; debounce?: number; loading?: boolean;
  source?: (query: string) => SelectItems | Promise<SelectItems>;
  onChange?: (value: string | string[] | undefined, labels: string[]) => void;
}
interface SelectApi {
  el: HTMLElement; input: HTMLInputElement;
  get(): string | string[] | undefined; set(value: string | string[] | null): void; setOptions(options: SelectItems): void;
  setDisabled(disabled: boolean): void; setInvalid(invalid: boolean): void; open(): void; close(): void; isOpen(): boolean;
}

interface CascaderNode { label: string; children?: CascaderNode[]; disabled?: boolean; [custom: string]: unknown }
interface CascaderConfig {
  data?: CascaderNode[]; value?: string[] | null; searchable?: boolean; clearable?: boolean; expandTrigger?: 'click' | 'hover'; size?: 'sm' | 'md' | 'lg';
  placeholder?: string; sep?: string; labelledby?: string; onChange?: (labels: string[], text: string, nodes: CascaderNode[]) => void;
}
interface CascaderApi {
  el: HTMLElement; input: HTMLInputElement; open(): void; close(): void;
  get(): string[]; getNodes(): CascaderNode[]; set(labels: string[]): void; setData(data: CascaderNode[]): void;
}

type DisabledDate = (date: Date) => string | false | null | undefined | void;
type DateLike = Date | string;
interface PickerBase { size?: 'sm' | 'md' | 'lg'; label?: string; labelledby?: string; msg?: string | Element }
interface DateConfig extends PickerBase { value?: DateLike | null; placeholder?: string; min?: DateLike | null; max?: DateLike | null; disabledDate?: DisabledDate; onChange?: (date: Date | null) => void }
interface DateApi { el: HTMLElement; input: HTMLInputElement; get(): Date | null; set(value: DateLike | null): void; open(): void; close(): void }
interface DateRangeConfig extends PickerBase { start?: DateLike | null; end?: DateLike | null; min?: DateLike | null; max?: DateLike | null; presets?: boolean; onChange?: (start: Date | null, end: Date | null) => void }
interface DateRangeApi { el: HTMLElement; input: HTMLInputElement; get(): [Date | null, Date | null]; set(start: DateLike | null, end: DateLike | null, user?: boolean): void; open(): void; close(): void }
interface TimeValue { h: number; m: number; s: number }
interface TimeConfig extends Omit<PickerBase, 'msg'> { value?: TimeValue | null; seconds?: boolean; stepM?: number; onChange?: (time: TimeValue | null) => void }
interface TimeApi { el: HTMLElement; input: HTMLInputElement; get(): TimeValue | null; set(value: TimeValue | string | null): void; open(): void; close(): void }
interface DateTimeValue { date: Date; time: TimeValue }
interface DateTimeConfig extends PickerBase { value?: DateTimeValue | string | null; min?: DateLike | null; max?: DateLike | null; disabledDate?: DisabledDate; onChange?: (value: DateTimeValue | null) => void }
interface DateTimeApi { el: HTMLElement; input: HTMLInputElement; get(): DateTimeValue | null; set(value: DateTimeValue | string | null): void; open(): void; close(): void }

interface PagerConfig {
  total?: number; page?: number; size?: number; sizes?: number[]; showTotal?: boolean; showSizeChanger?: boolean; showJumper?: boolean; simple?: boolean;
  sizeName?: 'sm' | 'md' | 'lg'; bordered?: boolean; disabled?: boolean; hideOnSinglePage?: boolean; siblings?: number; boundary?: number;
  onChange?: (page: number, size: number) => void;
}
interface PagerApi { root: HTMLElement; get(): { page: number; size: number; total: number; pages: number }; set(part: Partial<PagerConfig>): void; go(page: number, focusKey?: string): void }

interface PopconfirmOptions { title: string; desc?: string; okText?: string; cancelText?: string; kind?: 'warning' | 'info'; danger?: boolean; placement?: string; onConfirm?(): void | Promise<unknown> }

interface MenuItem { label?: string; icon?: string; shortcut?: string; danger?: boolean; disabled?: boolean; type?: 'sep' | 'group' | 'check' | 'radio'; checked?: boolean; name?: string; sub?: MenuItem[] }
interface CommandItem { id: string; label: string; group?: string; icon?: string; keywords?: string; hint?: string; run?(command: CommandItem): void }
interface CommandPaletteOptions { commands: CommandItem[]; placeholder?: string; label?: string; emptyText?: string; recent?: number; hotkey?: boolean; onRun?(command: CommandItem): void }
interface ChartConfig { type?: 'line' | 'area' | 'bar' | 'donut' | 'spark'; labels?: string[]; series: Array<{ name: string; data: Array<number | null> }>; height?: number; title?: string; legend?: boolean; points?: boolean; format?(v: number): string; inner?: number; centerLabel?: string }

interface ZhaoUIStatic {
  readonly version: string;
  /** Wire every component in `root` (default: the whole document) that is not wired yet. Called automatically on load and when nodes are added. */
  init(root?: ParentNode | Element): ZhaoUIStatic;
  /** Wire one element now, so a method called before page load never meets a half-built component. */
  ensure<T extends Element = Element>(target: T | string): T | null;
  component(name: string, def: ComponentDef): ZhaoUIStatic;
  setTheme(theme: ThemeOptions, el?: Element): ZhaoUIStatic;
  /** Needs modular/brand.js (already part of the full zhaoui.js); throws otherwise. */
  setBrand(hex: string, el?: Element): ZhaoUIStatic;
  applyBrand?(el: Element, hex: string): void;

  open(target: ElementOrSelector, opener?: Element): void;
  close(target: ElementOrSelector): void;
  dialog(options?: DialogOptions): Promise<boolean>;
  /** Returns a function that dismisses the message. */
  message(text: string, options?: MessageOptions): () => void;

  progress: { set(el: ElementOrSelector, value: number): void };
  ring: { set(el: ElementOrSelector, value: number, centerHtml?: string): void };
  badge: { paint(el: ElementOrSelector): void; pop(el: ElementOrSelector): void };
  otp: { value(el: ElementOrSelector): string; error(el: ElementOrSelector): void; ok(el: ElementOrSelector): void; clear(el: ElementOrSelector): void };
  icons: { add(name: string, svgInner: string): void; has(name: string): boolean };
  side: { setActive(nav: ElementOrSelector, hrefOrItem: string | Element): boolean; collapse(nav: ElementOrSelector, collapsed?: boolean): void };
  carousel: { go(el: ElementOrSelector, index: number): void };
  table: { selected(el: ElementOrSelector): HTMLTableRowElement[]; clear(el: ElementOrSelector): void };
  steps: { set(el: ElementOrSelector, state: { current?: number; error?: number; done?: boolean }): void; get(el: ElementOrSelector): { current: number; error: number; done: boolean } };
  calendar(host: ElementOrSelector, config?: { value?: string | Date | null; min?: string | Date; max?: string | Date; disabledDate?(d: Date): string | undefined | null | false; marks?(d: Date): { dots?: number[]; heat?: number; label?: string } | null }): { get(): Date | null; set(v: string | Date | null): void; refresh(): void } | null;
  menu(button: ElementOrSelector, items: MenuItem[], options?: { placement?: string; label?: string; trigger?: 'click' | 'manual'; onSelect?(item: MenuItem): void; onClose?(): void }): { open(): void; close(): void; toggle(): void; isOpen(): boolean };
  contextMenu(area: ElementOrSelector, items: MenuItem[], options?: { label?: string; onSelect?(item: MenuItem): void }): void;
  /** Needs modular/command.js (part of the full build). */
  commandPalette?(options: CommandPaletteOptions): { open(from?: Element): void; close(): void; setCommands(list: CommandItem[]): void; el: HTMLDialogElement };
  /** Need modular/chart.js (part of the full build). */
  chart?(host: ElementOrSelector, config: ChartConfig): { update(partial: Partial<ChartConfig>): void; toggle(seriesIndex: number, visible?: boolean): void } | null;
  tree?: { checked(el: ElementOrSelector): string[]; expandAll(el: ElementOrSelector): void; collapseAll(el: ElementOrSelector): void; select(el: ElementOrSelector, id: string): boolean };
  upload?: {
    files(el: ElementOrSelector): File[]; add(el: ElementOrSelector, files: FileList | File[]): void; clear(el: ElementOrSelector): void;
    /** Replaces data-action: return a promise; call onProgress(0..100) while uploading and register an abort callback with onAbort. */
    uploader(el: ElementOrSelector, fn: (file: File, ctl: { onProgress(percent: number): void; onAbort(cb: () => void): void }) => Promise<unknown>): void;
  };
  /** Returns the popover handle; `onConfirm` may return a promise, the button shows a spinner until it settles. */
  popconfirm(anchor: Element, options: PopconfirmOptions): { open(): void; close(): void; toggle(): void; isOpen(): boolean; destroy(): void };

  pager(el: ElementOrSelector, config?: PagerConfig): PagerApi | null;
  /** Needs modular/select.js (part of the full build). */
  select?(host: ElementOrSelector, config?: SelectConfig): SelectApi | null;
  cascader?(host: ElementOrSelector, config?: CascaderConfig): CascaderApi | null;
  /** Need modular/date.js (part of the full build). */
  datePicker?(host: ElementOrSelector, config?: DateConfig): DateApi | null;
  dateRangePicker?(host: ElementOrSelector, config?: DateRangeConfig): DateRangeApi | null;
  timePicker?(host: ElementOrSelector, config?: TimeConfig): TimeApi | null;
  dateTimePicker?(host: ElementOrSelector, config?: DateTimeConfig): DateTimeApi | null;
}

declare global {
  var ZhaoUI: ZhaoUIStatic;
  interface Window { ZhaoUI: ZhaoUIStatic }
  interface HTMLElement {
    zhSelect?: SelectApi; zhCascader?: CascaderApi; zhDate?: DateApi; zhDateRange?: DateRangeApi; zhTime?: TimeApi; zhDateTime?: DateTimeApi;
    zhSlider?: { get(): number[]; set(values: number[]): void }; zhRating?: { get(): number };
  }
  interface GlobalEventHandlersEventMap {
    'zh:open': CustomEvent<void>; 'zh:close': CustomEvent<void>;
    'zh:tab-change': CustomEvent<{ index: number; tab: HTMLElement }>;
    'zh:collapse-toggle': CustomEvent<{ item: HTMLElement; open: boolean }>;
    'zh:select': CustomEvent<{ value: string; item: HTMLElement }>;
    'zh:search': CustomEvent<{ query: string }>; 'zh:search-clear': CustomEvent<void>;
    'zh:number': CustomEvent<{ value: number }>;
    'zh:otp-complete': CustomEvent<{ value: string }>;
    'zh:edit-save': CustomEvent<{ value: string; previous: string }>; 'zh:edit-cancel': CustomEvent<void>;
    'zh:slider': CustomEvent<{ type: 'input' | 'change'; values: number[] }>;
    'zh:rating': CustomEvent<{ value: number }>;
    'zh:page-change': CustomEvent<{ page: number; size: number }>;
    'zh:tag-remove': CustomEvent<{ label: string; tag: HTMLElement }>;
    'zh:tag-change': CustomEvent<{ value: string; values: string[]; checked?: boolean }>;
    'zh:select-change': CustomEvent<{ value: string | string[] | undefined; labels: string[] }>;
    'zh:cascader-change': CustomEvent<{ path: string[]; text: string; nodes: CascaderNode[] }>;
    'zh:date-change': CustomEvent<{ value: string; date: Date | null }>;
    'zh:daterange-change': CustomEvent<{ start: string; end: string; dates: [Date | null, Date | null] }>;
    'zh:time-change': CustomEvent<{ value: string; time: TimeValue | null }>;
    'zh:side-select': CustomEvent<{ item: HTMLElement; href: string | null; label: string; path: string[] }>; 'zh:side-collapse': CustomEvent<{ collapsed: boolean }>;
    'zh:carousel-change': CustomEvent<{ index: number; slide: HTMLElement }>; 'zh:backtop': CustomEvent<void>;
    'zh:popover-open': CustomEvent<{ popover: HTMLElement }>; 'zh:popover-close': CustomEvent<void>; 'zh:popconfirm': CustomEvent<{ action: 'ok' | 'cancel' }>;
    'zh:table-sort': CustomEvent<{ index: number; key: string; direction: 'ascending' | 'descending' | 'none' }>; 'zh:table-select': CustomEvent<{ rows: HTMLTableRowElement[]; count: number; all: boolean }>;
    'zh:step-click': CustomEvent<{ index: number; title: string }>; 'zh:timeline-toggle': CustomEvent<{ item: HTMLElement; open: boolean }>;
    'zh:tree-select': CustomEvent<{ id: string; label: string }>; 'zh:tree-check': CustomEvent<{ id: string; checked: boolean; ids: string[] }>; 'zh:tree-toggle': CustomEvent<{ id: string; open: boolean }>;
    'zh:upload-add': CustomEvent<{ file: File }>; 'zh:upload-reject': CustomEvent<{ file: File; reason: string }>; 'zh:upload-done': CustomEvent<{ file: File; result: unknown }>; 'zh:upload-error': CustomEvent<{ file: File; reason: string }>; 'zh:upload-remove': CustomEvent<{ file: File }>;
    'zh:nav-select': CustomEvent<{ href: string | null; label: string }>; 'zh:anchor-change': CustomEvent<{ id: string | null; link: HTMLAnchorElement | null }>;
    'zh:calendar-change': CustomEvent<{ value: string; date: Date }>; 'zh:command-run': CustomEvent<{ id: string; command: CommandItem }>; 'zh:chart-hover': CustomEvent<{ index: number; label: string }>; 'zh:chart-toggle': CustomEvent<{ index: number; visible: boolean }>;
    'zh:datetime-change': CustomEvent<{ value: string; date: Date | null; time: TimeValue | null }>;
  }
}

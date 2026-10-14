// Compile-only check (tsc --noEmit --strict): every public call and event in the docs must type-check against index.d.ts.
import '../types/index';

const dlg: Promise<boolean> = ZhaoUI.dialog({ title: 'x', content: 'y', danger: true, cancel: false });
const dismiss: () => void = ZhaoUI.message('ok', { type: 'error', duration: 0 });
ZhaoUI.open('#a'); ZhaoUI.close(document.body); ZhaoUI.setTheme({ mode: 'dark', audience: 'c' }).setBrand('#00857f');
ZhaoUI.progress.set('#p', 50); ZhaoUI.ring.set('#r', 80, '<b>x</b>'); ZhaoUI.badge.paint('#b'); ZhaoUI.otp.error('#o');
const el: HTMLElement | null = ZhaoUI.ensure<HTMLElement>('#x');
const pager = ZhaoUI.pager('#pg', { total: 100, onChange: (p, s) => console.log(p + s) });
pager?.set({ total: 20 }); const info = pager?.get(); if (info) console.log(info.pages);
const sel = ZhaoUI.select?.('#s', { options: [{ label: 'g', options: [{ value: 'a', label: 'A' }] }], source: async (q) => [{ value: q, label: q }], onChange: (v, l) => console.log(v, l) });
sel?.set(['a']); const cas = ZhaoUI.cascader?.('#c', { data: [{ label: 'A', id: 1, children: [{ label: 'B' }] }], onChange: (labels, text, nodes) => console.log(labels, text, nodes[0]?.id) });
cas?.getNodes();
const dp = ZhaoUI.datePicker?.('#d', { min: '2026-01-01', max: new Date(), disabledDate: (d) => (d.getDay() === 0 ? 'no' : ''), onChange: (d) => d?.getFullYear() });
dp?.set('2026-10-01'); ZhaoUI.dateRangePicker?.('#r', { start: '2026-10-01' })?.set(new Date(), null);
ZhaoUI.timePicker?.('#t', { value: { h: 9, m: 0, s: 0 }, seconds: true })?.set('09:30'); ZhaoUI.dateTimePicker?.('#dt', { value: '2026-10-01 09:00' })?.get();

document.addEventListener('zh:select-change', (e) => { const v: string | string[] | undefined = e.detail.value; console.log(v, e.detail.labels); });
document.addEventListener('zh:daterange-change', (e) => console.log(e.detail.start, e.detail.dates[0]));
document.addEventListener('zh:tag-change', (e) => console.log(e.detail.values.length));
document.getElementById('x')?.addEventListener('zh:page-change', (e) => console.log(e.detail.page));
document.querySelector<HTMLSelectElement>('select')?.zhSelect?.get();
void dlg; void dismiss; void el;

// @ts-expect-error unknown theme value is rejected
ZhaoUI.setTheme({ mode: 'sepia' });
// @ts-expect-error message type must be one of the four kinds
ZhaoUI.message('x', { type: 'fatal' });

// navigation, carousel and popconfirm
const nav = document.querySelector('nav')!;
ZhaoUI.side.setActive(nav, '#/articles'); ZhaoUI.side.collapse(nav); ZhaoUI.side.collapse(nav, false);
ZhaoUI.carousel.go('#c', 2);
ZhaoUI.popconfirm(nav, { title: '删除？', danger: true, onConfirm: () => new Promise((r) => setTimeout(r, 10)) }).open();
nav.addEventListener('zh:side-select', (e) => { const p: string[] = e.detail.path; void p; e.preventDefault(); });
// @ts-expect-error placement must be a string
ZhaoUI.popconfirm(nav, { title: 'x', placement: 3 });

// table, steps, tree, upload
ZhaoUI.table.selected('#t').map((r) => r.rowIndex); ZhaoUI.table.clear('#t');
ZhaoUI.steps.set('#s', { current: 2 }); const st = ZhaoUI.steps.get('#s'); void st.current;
const ids: string[] = ZhaoUI.tree!.checked('#tr'); void ids; ZhaoUI.tree!.select('#tr', 'a');
ZhaoUI.upload!.uploader('#u', (file, ctl) => { ctl.onProgress(file.size > 0 ? 50 : 0); ctl.onAbort(() => {}); return Promise.resolve('ok'); });
nav.addEventListener('zh:table-sort', (e) => { const d: 'ascending' | 'descending' | 'none' = e.detail.direction; void d; });
// @ts-expect-error the uploader must return a promise
ZhaoUI.upload!.uploader('#u', () => 1);

// menus, command palette, charts, calendar
ZhaoUI.menu('#b', [{ label: '复制', shortcut: 'Ctrl+C' }, { type: 'sep' }, { label: '更多', sub: [{ label: '子项' }] }], { onSelect: (it) => void it.label });
ZhaoUI.contextMenu('#a', [{ type: 'check', label: '显示', checked: true }]);
ZhaoUI.commandPalette!({ commands: [{ id: 'x', label: 'X', run: () => {} }], hotkey: true }).open();
ZhaoUI.chart!('#c', { type: 'line', labels: ['a'], series: [{ name: 's', data: [1, null] }] })?.update({ height: 100 });
ZhaoUI.calendar('#d', { marks: (d) => (d.getDate() === 1 ? { dots: [1], label: 'x' } : null) })?.set('2026-01-01');
// @ts-expect-error unknown chart type
ZhaoUI.chart!('#c', { type: 'radar', series: [] });

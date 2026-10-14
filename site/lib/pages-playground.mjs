// The online playground: pick an example or write your own markup, see it run in a sandboxed frame next to the editor.
import { esc, GROUPS } from '../../packages/ui/scripts/facts.mjs';

export function playgroundPage({ metas }) {
  const by = Object.fromEntries(metas.map((m) => [m.name, m]));
  const data = Object.fromEntries(metas.map((m) => [m.name, { title: m.title, code: m.example }]));
  const options = GROUPS.map(([t, ns]) => `<optgroup label="${esc(t)}">${ns.filter((n) => by[n]).map((n) => `<option value="${n}">${esc(by[n].title)}</option>`).join('')}</optgroup>`).join('');
  const body = `<div class="pg">
  <header class="pg-bar">
    <h1>在线试用</h1>
    <label class="pg-pick"><span>从示例开始</span><span class="zh-select"><select id="pg-pick" aria-label="选择示例">${options}</select></span></label>
    <div class="pg-tools"><button class="zh-btn sm" type="button" id="pg-run"><i data-i="play"></i>运行</button><button class="zh-btn sm" type="button" id="pg-reset">还原示例</button><button class="zh-btn sm" type="button" id="pg-share">复制分享链接</button></div>
  </header>
  <p class="pg-hint" id="pg-status" role="status" aria-live="polite">修改左边的代码，右边会自动更新。预览在隔离的沙盒里运行，已经内置了 zhaoui.css、公共类、图标包和 zhaoui.js。</p>
  <div class="pg-panes">
    <div class="pg-pane"><label for="pg-code" class="pg-label">HTML</label><textarea id="pg-code" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off"></textarea></div>
    <div class="pg-pane"><span class="pg-label" id="pg-prev-l">预览</span><iframe id="pg-frame" title="预览" sandbox="allow-scripts allow-modals allow-forms allow-popups" aria-labelledby="pg-prev-l"></iframe></div>
  </div>
  <script type="application/json" id="pg-examples">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</div>`;
  return { title: '在线试用', description: '在浏览器里直接试用 ZhaoUI：选一个组件示例或自己写 HTML，实时预览，复制分享链接。', body, headings: [], section: 'playground', wide: true, scripts: ['assets/playground-bundle.js', 'assets/playground.js'] };
}

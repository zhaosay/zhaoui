// Where the site will live.  Every link inside the pages is relative, so it also opens from the file system; the origin and base path are only used for
// the things that must be absolute: canonical links, og:url, the sitemap and the llms.txt links.
export const SITE = {
  name: 'ZhaoUI',
  origin: 'https://ui.352m.com',
  base: '/',
  repo: 'https://github.com/zhaosay/zhaoui',
  lang: 'zh-CN',
  tagline: '不依赖框架的中文 UI 组件库',
};
export const abs = (path = '') => SITE.origin + SITE.base + path.replace(/^\//, '');

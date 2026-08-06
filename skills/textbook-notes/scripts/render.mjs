import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import texmath from 'markdown-it-texmath'
import katex from 'katex'
import container from 'markdown-it-container'
import anchor from 'markdown-it-anchor'

export const CALLOUTS = {
  goal: { icon: '🎯', label: 'Goal' },
  gap: { icon: '🔗', label: 'Going deeper' },
  proof: { icon: '📜', label: 'Proof' },
  insight: { icon: '💡', label: 'Insight' },
  qa: { icon: '❓', label: 'Q&A' },
  warning: { icon: '⚠️', label: 'Warning' },
  summary: { icon: '📌', label: 'Takeaway' },
}

export function slugify(s) {
  return String(s).trim().toLowerCase()
    .replace(/[^\wㄱ-힝]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createRenderer() {
  const md = new MarkdownIt({ html: true })
  md.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: false },
  })
  md.use(anchor, { slugify })
  for (const [name, meta] of Object.entries(CALLOUTS)) {
    md.use(container, name, {
      render(tokens, idx) {
        const tok = tokens[idx]
        if (tok.nesting === 1) {
          const custom = tok.info.trim().slice(name.length).trim()
          const title = custom || meta.label
          return `<div class="callout callout-${name}"><p class="callout-title"><span class="callout-icon">${meta.icon}</span>${md.utils.escapeHtml(title)}</p>\n`
        }
        return '</div>\n'
      },
    })
  }
  return md
}

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml',
}

/* ---- equation cross-references ------------------------------------------
   Display equations carrying \tag{N} become anchors (#eq-N). Textual
   references like "(20)" in prose become links; hovering shows a rendered
   preview of the equation, including equations defined in OTHER chapters
   of the same book (resolved through build/eq-map.json, per language).
   Chapters should be rebuilt together so the map is complete; a forward
   reference needs a second build pass. */

const TAG_RE = /\\tag\{([^}]+)\}/
const MATH_OR_CODE_RE = /(\$\$[\s\S]*?\$\$|```[\s\S]*?```|`[^`\n]*`|\$[^$\n]+\$)/g

export function langOf(file) {
  return /\.ko\.md$/.test(file) ? 'ko' : 'en'
}

export function collectEquations(src) {
  const out = []
  for (const m of src.matchAll(/\$\$([\s\S]*?)\$\$/g)) {
    const t = m[1].match(TAG_RE)
    if (t) out.push({ tag: t[1], latex: m[1] })
  }
  return out
}

export function linkifyEqRefs(src, resolve) {
  return src.split(MATH_OR_CODE_RE).map((seg, i) => {
    if (i % 2 === 1) return seg
    return seg.split('\n').map(line => {
      if (line.trimStart().startsWith(':::')) return line
      return line.replace(/\((\d+[a-z]?)\)/g, (m, tag) => {
        const href = resolve(tag)
        return href ? `<a class="eqref" data-eq="${tag}" href="${href}">(${tag})</a>` : m
      })
    }).join('\n')
  }).join('')
}

export function injectEqAnchors(html, src) {
  const tags = [...src.matchAll(/\$\$([\s\S]*?)\$\$/g)].map(m => {
    const t = m[1].match(TAG_RE)
    return t ? t[1] : null
  })
  let i = 0
  return html.replace(/<section>/g, () => {
    const tag = tags[i++]
    return tag ? `<section class="eq-block" id="eq-${tag}">` : '<section>'
  })
}

export function eqPreviewAssets(previews) {
  if (!Object.keys(previews).length) return ''
  const json = JSON.stringify(previews).replace(/<\//g, '<\\/')
  return `
<script>
const EQ_PREVIEWS = ${json};
let eqTip;
function eqShowTip(a) {
  const html = EQ_PREVIEWS[a.dataset.eq];
  if (!html) return;
  if (!eqTip) {
    eqTip = document.createElement('div');
    eqTip.className = 'eq-preview';
    document.body.appendChild(eqTip);
  }
  eqTip.innerHTML = html;
  eqTip.style.display = 'block';
  const r = a.getBoundingClientRect();
  const w = eqTip.offsetWidth;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - w - 8;
  eqTip.style.left = Math.max(8, Math.min(r.left + window.scrollX, maxLeft)) + 'px';
  eqTip.style.top = (r.bottom + window.scrollY + 8) + 'px';
}
document.addEventListener('DOMContentLoaded', () => {
  for (const a of document.querySelectorAll('a.eqref')) {
    a.addEventListener('mouseenter', () => eqShowTip(a));
    a.addEventListener('mouseleave', () => { if (eqTip) eqTip.style.display = 'none'; });
  }
});
</script>`
}

export function extractToc(md, src) {
  const tokens = md.parse(src, {})
  const toc = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type === 'heading_open' && (t.tag === 'h2' || t.tag === 'h3')) {
      const text = tokens[i + 1].children
        .filter(c => ['text', 'code_inline', 'math_inline'].includes(c.type))
        .map(c => c.content).join('')
      toc.push({ level: Number(t.tag[1]), text, id: slugify(text) })
    }
  }
  return toc
}

export function renderToc(toc) {
  if (!toc.length) return ''
  const items = toc
    .map(h => `<li class="toc-l${h.level}"><a href="#${h.id}">${h.text}</a></li>`)
    .join('\n')
  return `<nav class="toc"><p class="toc-label">Contents</p><ul>\n${items}\n</ul></nav>\n`
}

export function inlineImages(html, baseDir) {
  return html.replace(/(<img[^>]*\ssrc=")([^"]+)(")/g, (m, pre, src, post) => {
    if (/^(data:|https?:)/.test(src)) return m
    const p = path.resolve(baseDir, decodeURI(src))
    if (!fs.existsSync(p)) {
      console.warn(`warning: missing image ${src}`)
      return m
    }
    const mime = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'
    return `${pre}data:${mime};base64,${fs.readFileSync(p).toString('base64')}${post}`
  })
}

export function rewriteMdLinks(html) {
  return html.replace(/(<a[^>]*\shref=")([^"#]+)\.md(#[^"]*)?(")/g,
    (m, pre, base, hash, post) =>
      /^https?:/.test(base) ? m : `${pre}${base}.html${hash || ''}${post}`)
}

export function katexCss() {
  const require = createRequire(import.meta.url)
  const cssPath = require.resolve('katex/dist/katex.min.css')
  const dist = path.dirname(cssPath)
  let css = fs.readFileSync(cssPath, 'utf8')
  css = css.replace(
    /src:url\(fonts\/([^)]+)\.woff2\) format\("woff2"\)[^;}]*/g,
    (m, name) => {
      const buf = fs.readFileSync(path.join(dist, 'fonts', `${name}.woff2`))
      return `src:url(data:font/woff2;base64,${buf.toString('base64')}) format("woff2")`
    })
  return css
}

export function page({ title, tocHtml, bodyHtml, css }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${css}
</style>
</head>
<body>
<main class="note">
${tocHtml}${bodyHtml}</main>
</body>
</html>
`
}

function main() {
  const args = process.argv.slice(2)
  const oIdx = args.indexOf('-o')
  const out = oIdx >= 0 ? args[oIdx + 1] : null
  const input = args.find(a => a.endsWith('.md'))
  if (!input) {
    console.error('usage: render.mjs <input.md> [-o out.html]')
    process.exit(1)
  }
  const src = fs.readFileSync(input, 'utf8')
  const md = createRenderer()

  const lang = langOf(input)
  const eqs = collectEquations(src)
  const outName = `${path.basename(input, '.md')}.html`
  const mapPath = path.join(path.dirname(input), 'build', 'eq-map.json')
  let eqMap = {}
  try { eqMap = JSON.parse(fs.readFileSync(mapPath, 'utf8')) } catch {}
  for (const { tag, latex } of eqs) eqMap[`${lang}:${tag}`] = { file: outName, latex }
  fs.mkdirSync(path.dirname(mapPath), { recursive: true })
  fs.writeFileSync(mapPath, JSON.stringify(eqMap, null, 1))

  const selfTags = new Map(eqs.map(e => [e.tag, e.latex]))
  const usedTags = new Set()
  const linked = linkifyEqRefs(src, tag => {
    if (selfTags.has(tag)) { usedTags.add(tag); return `#eq-${tag}` }
    const hit = eqMap[`${lang}:${tag}`]
    if (hit) { usedTags.add(tag); return `${hit.file}#eq-${tag}` }
    return null
  })

  let body = md.render(linked)
  body = injectEqAnchors(body, linked)
  body = inlineImages(body, path.dirname(input))
  body = rewriteMdLinks(body)

  const previews = {}
  for (const tag of usedTags) {
    const latex = selfTags.get(tag) ?? eqMap[`${lang}:${tag}`]?.latex
    if (latex) previews[tag] = katex.renderToString(latex, { displayMode: true, throwOnError: false })
  }
  body += eqPreviewAssets(previews)
  const title = (src.match(/^#\s+(.+)$/m) || [null, path.basename(input, '.md')])[1]
  const skillCss = fs.readFileSync(new URL('../assets/style.css', import.meta.url), 'utf8')
  const toc = renderToc(extractToc(md, src))
  if (toc) {
    body = body.includes('</h1>') ? body.replace('</h1>', `</h1>\n${toc}`) : toc + body
  }
  const html = page({
    title,
    tocHtml: '',
    bodyHtml: body,
    css: `${katexCss()}\n${skillCss}`,
  })
  const dest = out || path.join(path.dirname(input), 'build', `${path.basename(input, '.md')}.html`)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, html)
  console.log(dest)
}

// Compare real paths: the skill is commonly installed as a symlink into
// ~/.claude/skills, and argv[1] then keeps the symlink path while
// import.meta.url is already resolved.
export function isMainModule(argv1, moduleUrl) {
  if (!argv1) return false
  const real = p => { try { return fs.realpathSync(p) } catch { return path.resolve(p) } }
  return real(argv1) === real(fileURLToPath(moduleUrl))
}

if (isMainModule(process.argv[1], import.meta.url)) main()

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
    katexOptions: {
      throwOnError: false,
      trust: ctx => ctx.command === '\\htmlData',
      strict: code => (code === 'htmlExtension' ? 'ignore' : 'warn'),
    },
  })
  md.use(anchor, { slugify })
  md.use(container, 'symbols', {
    render(tokens, idx) {
      const tok = tokens[idx]
      if (tok.nesting === 1) {
        const custom = tok.info.trim().slice('symbols'.length).trim()
        return `<div class="symbols"><p class="symbols-title">${md.utils.escapeHtml(custom || 'Notation')}</p>\n`
      }
      return '</div>\n'
    },
  })
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
      return line.replace(/\((\d+(?:\.\d+)*[a-z]?)\)/g, (m, tag) => {
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

export function previewAssets(eqPreviews, symPreviews) {
  if (!Object.keys(eqPreviews).length && !Object.keys(symPreviews).length) return ''
  const json = o => JSON.stringify(o).replace(/<\//g, '<\\/')
  return `
<script>
const EQ_PREVIEWS = ${json(eqPreviews)};
const SYM_PREVIEWS = ${json(symPreviews)};
let tip;
function showTip(a, html) {
  if (!html) return;
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'hover-preview';
    document.body.appendChild(tip);
  }
  tip.innerHTML = html;
  tip.style.display = 'block';
  const r = a.getBoundingClientRect();
  const w = tip.offsetWidth;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - w - 8;
  tip.style.left = Math.max(8, Math.min(r.left + window.scrollX, maxLeft)) + 'px';
  tip.style.top = (r.bottom + window.scrollY + 8) + 'px';
}
function hideTip() { if (tip) tip.style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => {
  for (const a of document.querySelectorAll('a.eqref')) {
    a.addEventListener('mouseenter', () => showTip(a, EQ_PREVIEWS[a.dataset.eq]));
    a.addEventListener('mouseleave', hideTip);
  }
  for (const a of document.querySelectorAll('a.symref')) {
    a.addEventListener('mouseenter', () => showTip(a,
      a.dataset.syms.split(' ').map(id => SYM_PREVIEWS[id]).filter(Boolean).join('')));
    a.addEventListener('mouseleave', hideTip);
    a.addEventListener('click', hideTip);
  }
  for (const el of document.querySelectorAll('.katex [data-sym]')) {
    el.addEventListener('mouseenter', () => showTip(el, SYM_PREVIEWS[el.dataset.sym]));
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('click', () => { hideTip(); if (el.dataset.symhref) location.href = el.dataset.symhref; });
  }
});
</script>`
}

/* ---- symbol definitions --------------------------------------------------
   A "::: symbols" block holds one "- $latex$ : definition" line per symbol
   and renders as a notation box whose entries carry #sym-* anchors. Every
   inline math occurrence of a defined symbol becomes a link to its entry
   with a hover preview of the definition. Occurrences are matched after
   index normalization, so p_2, p_u(i-1), N_{i+1} all resolve to the p_i,
   p_u(i), N_i entries; role subscripts (u, d, s, b) stay literal. Symbols
   defined in other chapters of the same book resolve through
   build/sym-map.json, per language, with the same rebuild caveat as
   eq-map.json. */

const IDX_RE = /^[ijkt0-9+\-]+$/
const SYM_ENTRY_RE = /^-\s+\$([^$]+)\$\s*[:：]\s*(.+?)\s*$/

export function normalizeSym(tex) {
  let s = tex.replace(/\\[,;:!]/g, '').replace(/\s+/g, '')
  s = s.replace(/_\{(\w)\}/g, '_$1')
  s = s.replace(/_\{([^{}]*)\}/g, (m, a) => (IDX_RE.test(a) ? '_#' : m))
  s = s.replace(/_([ijkt0-9])(?![a-zA-Z0-9])/g, '_#')
  s = s.replace(/\(([^()]*)\)/g, (m, a) => (IDX_RE.test(a) ? '(#)' : m))
  return s
}

export function collectSymbols(src) {
  const out = []
  const ids = new Set()
  for (const block of src.matchAll(/^:{3,}\s*symbols[^\n]*\n([\s\S]*?)^:{3,}\s*$/gm)) {
    for (const line of block[1].split('\n')) {
      if (!line.trimStart().startsWith('- ')) continue
      const m = line.trim().match(SYM_ENTRY_RE)
      if (!m) {
        console.warn(`warning: symbols entry not "- $latex$ : definition": ${line.trim()}`)
        out.push(null)
        continue
      }
      let id = 'sym-' + m[1].replace(/\\/g, '').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '')
      for (let n = 2; ids.has(id); n++) id = `${id}-${n}`
      ids.add(id)
      out.push({ key: m[1], def: m[2], norm: normalizeSym(m[1]), id })
    }
  }
  return out
}

export function injectSymAnchors(html, symbols) {
  let i = 0
  return html.replace(/(<div class="symbols">[\s\S]*?<\/div>)/g, box =>
    box.replace(/<li>/g, li => {
      const sym = symbols[i++]
      return sym ? `<li id="${sym.id}">` : li
    }))
}

function decodeEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
}

function splitTopCommas(tex) {
  const parts = []
  let depth = 0, cur = ''
  for (const ch of tex) {
    if ('({['.includes(ch)) depth++
    else if (')}]'.includes(ch)) depth--
    if (ch === ',' && depth === 0) { parts.push(cur); cur = '' } else cur += ch
  }
  parts.push(cur)
  return parts.filter(p => p.trim())
}

export function linkifySymbols(html, lookup) {
  const used = new Map()
  const out = html.split(/(<div class="symbols">[\s\S]*?<\/div>)/g).map((seg, i) => {
    if (i % 2 === 1) return seg
    return seg.replace(/<eq>[\s\S]*?<\/eq>/g, eq => {
      const ann = eq.match(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/)
      if (!ann) return eq
      const hits = []
      for (const part of splitTopCommas(decodeEntities(ann[1]))) {
        const hit = lookup.get(normalizeSym(part))
        if (hit && !hits.includes(hit)) hits.push(hit)
      }
      if (!hits.length) return eq
      for (const h of hits) used.set(h.id, h)
      return `<a class="symref" href="${hits[0].href}" data-syms="${hits.map(h => h.id).join(' ')}">${eq}</a>`
    })
  }).join('')
  return { html: out, used }
}

/* Display equations: wrap each occurrence of a defined symbol in the TeX
   source with \htmlData{sym=..., symhref=...} (rendered by KaTeX under the
   trust option above), so symbols inside $$...$$ get the same hover
   definition and click-to-jump as inline occurrences. Runs on the markdown
   source AFTER collectEquations, so eq-map.json and eq previews stay clean. */

const DISP_CAND_RE =
  /(\\mathbf\{[a-zA-Z]\}|\\bar\s*[a-zA-Z]|\\[a-zA-Z]+|[A-Za-z])(_\{[^{}]+\}|_[A-Za-z0-9])?(\([^()]*\))?/g

export function wrapDisplaySymbols(src, lookup) {
  const used = new Map()
  const out = src.replace(/\$\$([\s\S]*?)\$\$/g, (whole, tex) => {
    const masks = []
    const masked = tex.replace(/\\(tag|text|operatorname)\s*\{[^{}]*\}/g, m => {
      masks.push(m)
      return `\u0001${masks.length - 1}\u0001`
    })
    let res = '', last = 0, m
    DISP_CAND_RE.lastIndex = 0
    while ((m = DISP_CAND_RE.exec(masked))) {
      const cand = m[0]
      let hit = lookup.get(normalizeSym(cand))
      if (!hit && cand.includes('(')) {
        hit = lookup.get(normalizeSym(
          cand.replace(/\(([^()]*)\)/g, (g, a) => `(${a.replace(/,/g, ';')})`)))
      }
      if (!hit) continue
      used.set(hit.id, hit)
      res += masked.slice(last, m.index)
        + `\\htmlData{sym=${hit.id}, symhref=${hit.href}}{${cand}}`
      last = m.index + cand.length
    }
    res += masked.slice(last)
    res = res.replace(/\u0001(\d+)\u0001/g, (g, i) => masks[Number(i)])
    return `$$${res}$$`
  })
  return { src: out, used }
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

  const syms = collectSymbols(src)
  const symMapPath = path.join(path.dirname(input), 'build', 'sym-map.json')
  let symMap = {}
  try { symMap = JSON.parse(fs.readFileSync(symMapPath, 'utf8')) } catch {}
  for (const s of syms) {
    if (s) symMap[`${lang}:${s.norm}`] = { file: outName, id: s.id, latex: s.key, def: s.def }
  }
  fs.writeFileSync(symMapPath, JSON.stringify(symMap, null, 1))

  const symLookup = new Map()
  for (const [mk, v] of Object.entries(symMap)) {
    const sep = mk.indexOf(':')
    if (mk.slice(0, sep) !== lang || v.file === outName) continue
    symLookup.set(mk.slice(sep + 1), { id: v.id, href: `${v.file}#${v.id}`, latex: v.latex, def: v.def })
  }
  for (const s of syms) {
    if (s) symLookup.set(s.norm, { id: s.id, href: `#${s.id}`, latex: s.key, def: s.def })
  }

  const selfTags = new Map(eqs.map(e => [e.tag, e.latex]))
  const usedTags = new Set()
  const linked = linkifyEqRefs(src, tag => {
    if (selfTags.has(tag)) { usedTags.add(tag); return `#eq-${tag}` }
    const hit = eqMap[`${lang}:${tag}`]
    if (hit) { usedTags.add(tag); return `${hit.file}#eq-${tag}` }
    return null
  })

  const disp = wrapDisplaySymbols(linked, symLookup)
  let body = md.render(disp.src)
  body = injectEqAnchors(body, disp.src)
  body = injectSymAnchors(body, syms)
  const { html: symLinked, used: usedSyms } = linkifySymbols(body, symLookup)
  body = symLinked
  for (const [id, s] of disp.used) usedSyms.set(id, s)
  body = inlineImages(body, path.dirname(input))
  body = rewriteMdLinks(body)

  const eqPreviews = {}
  for (const tag of usedTags) {
    const latex = selfTags.get(tag) ?? eqMap[`${lang}:${tag}`]?.latex
    if (latex) eqPreviews[tag] = katex.renderToString(latex, { displayMode: true, throwOnError: false })
  }
  const symPreviews = {}
  for (const [id, s] of usedSyms) {
    symPreviews[id] = `<p class="sym-row">${katex.renderToString(s.latex, { throwOnError: false })}`
      + `<span class="sym-sep"> : </span>${md.renderInline(s.def)}</p>`
  }
  body += previewAssets(eqPreviews, symPreviews)
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

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRenderer, extractToc, renderToc, inlineImages, rewriteMdLinks, katexCss, page, isMainModule, normalizeSym, collectSymbols, injectSymAnchors, linkifySymbols, previewAssets } from './render.mjs'

test('renders inline and display math with KaTeX', () => {
  const md = createRenderer()
  const html = md.render('Let $x^2$ grow.\n\n$$E = mc^2$$\n')
  assert.match(html, /class="katex"/)
  assert.match(html, /katex-display/)
})

test('renders callout containers with icon and custom title', () => {
  const md = createRenderer()
  const html = md.render('::: warning The trap of lambda\nbody text\n:::\n')
  assert.match(html, /callout callout-warning/)
  assert.match(html, /⚠️/)
  assert.match(html, /The trap of lambda/)
  assert.match(html, /body text/)
})

test('callout title falls back to default label', () => {
  const md = createRenderer()
  const html = md.render('::: gap\nrestored steps\n:::\n')
  assert.match(html, /Going deeper/)
})

test('all callout types render', () => {
  const md = createRenderer()
  for (const name of ['goal', 'gap', 'insight', 'qa', 'warning', 'summary']) {
    assert.match(md.render(`::: ${name}\nx\n:::\n`), new RegExp(`callout-${name}`))
  }
})

test('toc lists h2/h3 with ids matching anchor ids', () => {
  const md = createRenderer()
  const src = '# Title\n\n## Alpha Beta\n\n### Gamma Delta\n'
  const toc = extractToc(md, src)
  assert.deepEqual(toc, [
    { level: 2, text: 'Alpha Beta', id: 'alpha-beta' },
    { level: 3, text: 'Gamma Delta', id: 'gamma-delta' },
  ])
  assert.match(md.render(src), /<h2 id="alpha-beta"/)
  assert.match(renderToc(toc), /href="#gamma-delta"/)
})

test('inlines local images as data uris, leaves remote alone', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tn-'))
  fs.writeFileSync(path.join(dir, 'f.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
  assert.match(inlineImages('<img src="f.svg" alt="">', dir), /src="data:image\/svg\+xml;base64,/)
  const remote = '<img src="https://x.com/a.png">'
  assert.equal(inlineImages(remote, dir), remote)
})

test('rewrites relative .md links to .html, leaves absolute urls', () => {
  assert.equal(rewriteMdLinks('<a href="ch04-x.md#sec">l</a>'), '<a href="ch04-x.html#sec">l</a>')
  const abs = '<a href="https://ex.com/a.md">l</a>'
  assert.equal(rewriteMdLinks(abs), abs)
})

test('katex css embeds woff2 fonts and drops file references', () => {
  const css = katexCss()
  assert.match(css, /data:font\/woff2;base64,/)
  assert.doesNotMatch(css, /url\(fonts\//)
})

test('cli renders a fixture into one offline html file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tn-e2e-'))
  fs.writeFileSync(path.join(dir, 'fix.md'), [
    '# Fixture Note', '',
    '## Section One', '',
    'Inline $a^2+b^2=c^2$ math.', '',
    '$$\\frac{1}{e_d(i-1)} = \\frac{p_d(i-1)+r_d(i-1)}{r_d(i-1)}$$', '',
    '::: qa Why decompose?', 'Because the full chain state space explodes.', ':::', '',
  ].join('\n'))
  const out = execFileSync('node',
    [path.join(import.meta.dirname, 'render.mjs'), path.join(dir, 'fix.md')],
    { encoding: 'utf8' }).trim()
  const html = fs.readFileSync(out, 'utf8')
  assert.match(html, /callout-qa/)
  assert.match(html, /--canvas: #fffaf0/)
  assert.match(html, /data:font\/woff2/)
  assert.doesNotMatch(html, /<link|<script src/)
})

test('cli runs when invoked through a symlinked skill dir', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tn-link-'))
  const link = path.join(dir, 'skill')
  fs.symlinkSync(path.dirname(import.meta.dirname), link)
  fs.writeFileSync(path.join(dir, 'fix.md'), '# Linked\n\nBody $x$.\n')
  const out = execFileSync('node',
    [path.join(link, 'scripts', 'render.mjs'), path.join(dir, 'fix.md')],
    { encoding: 'utf8' }).trim()
  assert.ok(out, 'render.mjs printed no output path')
  assert.match(fs.readFileSync(out, 'utf8'), /class="katex"/)
})

test('isMainModule matches a symlinked argv against the resolved module url', () => {
  const self = fileURLToPath(import.meta.url)
  assert.equal(isMainModule(self, import.meta.url), true)
  assert.equal(isMainModule(path.join(os.tmpdir(), 'nope.mjs'), import.meta.url), false)
  assert.equal(isMainModule(undefined, import.meta.url), false)
})

test('page shell produces standalone html', () => {
  const html = page({ title: 'T', tocHtml: '<nav></nav>', bodyHtml: '<p>b</p>', css: '.x{}' })
  assert.match(html, /^<!doctype html>/)
  assert.match(html, /<title>T<\/title>/)
  assert.match(html, /\.x\{\}/)
})

test('collectEquations finds tagged display blocks', async () => {
  const { collectEquations } = await import('./render.mjs')
  const src = '$$a = b \\tag{4}$$\n\ntext\n\n$$c = d$$\n\n$$e \\tag{5a}$$\n'
  const eqs = collectEquations(src)
  assert.deepEqual(eqs.map(e => e.tag), ['4', '5a'])
})

test('linkifyEqRefs links known tags outside math, skips ::: lines', async () => {
  const { linkifyEqRefs } = await import('./render.mjs')
  const resolve = tag => (tag === '4' ? '#eq-4' : null)
  const out = linkifyEqRefs('see (4) and (99)\n\n$$f(4) \\tag{6}$$\n\n::: qa about (4)\nbody (4)\n:::\n', resolve)
  assert.match(out, /<a class="eqref" data-eq="4" href="#eq-4">\(4\)<\/a> and \(99\)/)
  assert.match(out, /\$\$f\(4\) \\tag\{6\}\$\$/)
  assert.match(out, /::: qa about \(4\)\n/)
  assert.match(out, /body <a class="eqref"/)
})

test('linkifyEqRefs links dotted tags like (6.10)', async () => {
  const { linkifyEqRefs } = await import('./render.mjs')
  const resolve = tag => (tag === '6.10' ? '#eq-6.10' : null)
  const out = linkifyEqRefs('see (6.10) and (1951)\n', resolve)
  assert.match(out, /<a class="eqref" data-eq="6.10" href="#eq-6.10">\(6\.10\)<\/a> and \(1951\)/)
})

test('normalizeSym canonicalizes index arguments, keeps role subscripts', () => {
  assert.equal(normalizeSym('p_u(i-1)'), 'p_u(#)')
  assert.equal(normalizeSym('M_1'), 'M_#')
  assert.equal(normalizeSym('e_d'), 'e_d')
  assert.equal(normalizeSym('n_{i-1}(t-1)'), 'n_#(#)')
  assert.equal(normalizeSym('p_{u}'), 'p_u')
  assert.equal(normalizeSym('\\bar n(i)'), '\\barn(#)')
  assert.equal(normalizeSym('E(r, p_u, N)'), 'E(r,p_u,N)')
  assert.equal(normalizeSym('e_{i+1}'), 'e_#')
})

test('collectSymbols parses entries, nulls bad lines, dedupes ids', () => {
  const src = [
    '::: symbols 기호', '',
    '- $p_i$ : failure probability of $M_i$',
    '- $L(i)$ : two-machine line around buffer $B_i$',
    '- not an entry',
    '- $p_j$ : duplicate norm of p_i',
    ':::',
  ].join('\n')
  const syms = collectSymbols(src)
  assert.equal(syms.length, 4)
  assert.deepEqual(syms[0], { key: 'p_i', def: 'failure probability of $M_i$', norm: 'p_#', id: 'sym-p_i' })
  assert.equal(syms[1].id, 'sym-L-i')
  assert.equal(syms[2], null)
  assert.equal(syms[3].norm, 'p_#')
  assert.notEqual(syms[3].id, syms[0].id)
})

test('symbols container renders a titled box', () => {
  const md = createRenderer()
  const html = md.render('::: symbols\n- $p_i$ : def\n:::\n')
  assert.match(html, /<div class="symbols"><p class="symbols-title">Notation<\/p>/)
  const ko = md.render('::: symbols 기호\n- $p_i$ : def\n:::\n')
  assert.match(ko, /<p class="symbols-title">기호<\/p>/)
})

test('injectSymAnchors ids list items in order, skips null entries', () => {
  const html = '<div class="symbols"><ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n</ul></div>'
  const syms = [{ id: 'sym-a' }, null, { id: 'sym-c' }]
  const out = injectSymAnchors(html, syms)
  assert.match(out, /<li id="sym-a">a<\/li>/)
  assert.match(out, /<li>b<\/li>/)
  assert.match(out, /<li id="sym-c">c<\/li>/)
})

test('linkifySymbols wraps matching inline math, resolves comma lists', () => {
  const md = createRenderer()
  const lookup = new Map([
    ['p_#', { id: 'sym-p_i', href: '#sym-p_i' }],
    ['r_u(#)', { id: 'sym-r_u-i', href: '#sym-r_u-i' }],
  ])
  const body = md.render('Fails with $p_2$ per cycle. Pair $p_u(i), r_u(i-1)$ here. No hit: $x^2$.')
  const { html, used } = linkifySymbols(body, lookup)
  assert.match(html, /<a class="symref" href="#sym-p_i" data-syms="sym-p_i"><eq>/)
  assert.match(html, /<a class="symref" href="#sym-r_u-i" data-syms="sym-r_u-i"><eq>/)
  assert.match(html, /No hit: <eq>/)
  assert.deepEqual([...used.keys()].sort(), ['sym-p_i', 'sym-r_u-i'])
})

test('linkifySymbols leaves math inside the symbols box alone', () => {
  const md = createRenderer()
  const lookup = new Map([['p_#', { id: 'sym-p_i', href: '#sym-p_i' }]])
  const body = md.render('::: symbols\n- $p_i$ : def\n:::\n\nBody $p_i$.\n')
  const { html } = linkifySymbols(body, lookup)
  const box = html.match(/<div class="symbols">[\s\S]*?<\/div>/)[0]
  assert.doesNotMatch(box, /symref/)
  assert.match(html, /<a class="symref" href="#sym-p_i"/)
})

test('previewAssets emits both preview maps and one script', () => {
  const out = previewAssets({ 4: '<span>eq</span>' }, { 'sym-p_i': '<p>def</p>' })
  assert.match(out, /EQ_PREVIEWS = \{"4":/)
  assert.match(out, /SYM_PREVIEWS = \{"sym-p_i":/)
  assert.match(out, /symref/)
  assert.equal(previewAssets({}, {}), '')
})

test('cli renders symbol tooltips and writes sym-map.json', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tn-sym-'))
  fs.writeFileSync(path.join(dir, 'ch01-fix.md'), [
    '# Sym Fixture', '',
    '::: symbols',
    '- $p_i$ : failure probability of machine $M_i$',
    '- $L(i)$ : line built around buffer $i$',
    ':::', '',
    'Fails with $p_2$ each cycle, see line $L(3)$.', '',
  ].join('\n'))
  const out = execFileSync('node',
    [path.join(import.meta.dirname, 'render.mjs'), path.join(dir, 'ch01-fix.md')],
    { encoding: 'utf8' }).trim()
  const html = fs.readFileSync(out, 'utf8')
  assert.match(html, /<li id="sym-p_i">/)
  assert.match(html, /<a class="symref" href="#sym-p_i"/)
  assert.match(html, /SYM_PREVIEWS/)
  const map = JSON.parse(fs.readFileSync(path.join(dir, 'build', 'sym-map.json'), 'utf8'))
  assert.equal(map['en:p_#'].file, 'ch01-fix.html')
  assert.equal(map['en:p_#'].latex, 'p_i')
})

test('cli resolves symbols defined in another chapter through sym-map.json', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tn-symx-'))
  fs.mkdirSync(path.join(dir, 'build'))
  fs.writeFileSync(path.join(dir, 'build', 'sym-map.json'), JSON.stringify({
    'en:z_#': { file: 'ch01-other.html', id: 'sym-z_i', latex: 'z_i', def: 'an external thing' },
  }))
  fs.writeFileSync(path.join(dir, 'ch02-fix.md'), '# X\n\nUses $z_2$ here.\n')
  const out = execFileSync('node',
    [path.join(import.meta.dirname, 'render.mjs'), path.join(dir, 'ch02-fix.md')],
    { encoding: 'utf8' }).trim()
  const html = fs.readFileSync(out, 'utf8')
  assert.match(html, /<a class="symref" href="ch01-other\.html#sym-z_i"/)
  assert.match(html, /SYM_PREVIEWS = \{"sym-z_i":/)
})

test('injectEqAnchors ids tagged sections in order', async () => {
  const { injectEqAnchors } = await import('./render.mjs')
  const src = '$$a \\tag{4}$$\n\n$$b$$\n\n$$c \\tag{5}$$\n'
  const html = '<section>x</section><section>y</section><section>z</section>'
  const out = injectEqAnchors(html, src)
  assert.equal(out, '<section class="eq-block" id="eq-4">x</section><section>y</section><section class="eq-block" id="eq-5">z</section>')
})

test('wrapDisplaySymbols wraps defined symbols inside display math', async () => {
  const { wrapDisplaySymbols } = await import('./render.mjs')
  const lookup = new Map([
    ['P(#)', { id: 'sym-P-i', href: '#sym-P-i' }],
    ['p_u(#)', { id: 'sym-p_u-i', href: '#sym-p_u-i' }],
    ['\\mathbf{p}(i-1;001)', { id: 'sym-p001', href: '#sym-p001' }],
  ])
  const src = 'x\n\n$$p_u(i) = \\frac{\\mathbf{p}(i-1,001)}{P(i)} \\text{prob up} \\tag{4.1}$$\n'
  const { src: out, used } = wrapDisplaySymbols(src, lookup)
  assert.match(out, /\\htmlData\{sym=sym-p_u-i, symhref=#sym-p_u-i\}\{p_u\(i\)\}/)
  assert.match(out, /\\htmlData\{sym=sym-P-i, symhref=#sym-P-i\}\{P\(i\)\}/)
  assert.match(out, /\\htmlData\{sym=sym-p001, symhref=#sym-p001\}\{\\mathbf\{p\}\(i-1,001\)\}/)
  assert.match(out, /\\text\{prob up\}/)
  assert.match(out, /\\tag\{4\.1\}/)
  assert.equal(used.size, 3)
})

test('wrapDisplaySymbols leaves inline math and unknown symbols alone', async () => {
  const { wrapDisplaySymbols } = await import('./render.mjs')
  const lookup = new Map([['k', { id: 'sym-k', href: '#sym-k' }]])
  const { src: out } = wrapDisplaySymbols('$k$ stays, $$i = 1, \\dots, k-1$$', lookup)
  assert.match(out, /^\$k\$ stays/)
  assert.match(out, /\\htmlData\{sym=sym-k, symhref=#sym-k\}\{k\}-1\$\$/)
})

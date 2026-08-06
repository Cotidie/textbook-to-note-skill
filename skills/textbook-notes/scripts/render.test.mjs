import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRenderer, extractToc, renderToc, inlineImages, rewriteMdLinks, katexCss, page, isMainModule } from './render.mjs'

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

test('injectEqAnchors ids tagged sections in order', async () => {
  const { injectEqAnchors } = await import('./render.mjs')
  const src = '$$a \\tag{4}$$\n\n$$b$$\n\n$$c \\tag{5}$$\n'
  const html = '<section>x</section><section>y</section><section>z</section>'
  const out = injectEqAnchors(html, src)
  assert.equal(out, '<section class="eq-block" id="eq-4">x</section><section>y</section><section class="eq-block" id="eq-5">z</section>')
})

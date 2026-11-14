// SPDX-License-Identifier: Apache-2.0
/**
 * 状態のアイコンと線のアイコン。形は 共通UIガイドラインの icons/*.svg（info だけ独自の「塗りの円＋i」）。
 * 色はここに書かない。部品の役（data-part="ring|fill|line|mark"）だけを付け、色は components.css の .tsk-icon--<種類> が決める。
 * 状態のアイコンは形でも区別でき、必ず文字のラベルを持つ（role="img" と aria-label）。
 * 同じ表から、HTML の文字列（statusIconMarkup）と DOM の要素（statusIconNode）の両方を作る。
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** [要素, 属性] の並び。数値・形だけ（色は持たない） */
const RING = (extra = {}) => ['circle', { 'data-part': 'ring', cx: '8', cy: '8', r: '6', 'stroke-width': '1.6', ...extra }];
const DISC = ['circle', { 'data-part': 'fill', cx: '8', cy: '8', r: '6.5' }];
const MARK = (d, extra = {}) => ['path', { 'data-part': 'mark', d, 'stroke-width': '1.6', 'stroke-linecap': 'round', ...extra }];

/**
 * 種類 → { 見出しの既定, 形 }。意味は guidelines 04: 灰＝未着手、橙＝進行中、青＝相手の確認待ち、緑＝完了、赤＝異常
 */
export const STATUS_ICONS = Object.freeze({
  idea: { label: 'アイデア', viewBox: '0 0 16 16', shapes: [RING({ 'stroke-dasharray': '2.2 2.2' })] },
  todo: { label: '未着手', viewBox: '0 0 16 16', shapes: [RING()] },
  none: { label: 'なし', viewBox: '0 0 16 16', shapes: [RING(), ['path', { 'data-part': 'line', d: 'M5.5 8h5', 'stroke-width': '1.6', 'stroke-linecap': 'round' }]] },
  progress: { label: '進行中', viewBox: '0 0 16 16', shapes: [RING(), ['path', { 'data-part': 'fill', d: 'M8 2 A6 6 0 0 1 8 14 Z' }]] },
  waiting: { label: '確認待ち', viewBox: '0 0 16 16', shapes: [RING(), ['path', { 'data-part': 'fill', d: 'M8 8 L8 2 A6 6 0 1 1 2 8 Z' }]] },
  success: { label: '完了', viewBox: '0 0 16 16', shapes: [DISC, MARK('m5.2 8.2 1.9 1.9 3.7-3.9', { 'stroke-linejoin': 'round' })] },
  info: { label: 'お知らせ', viewBox: '0 0 16 16', shapes: [DISC, MARK('M8 7.2v4M8 4.8h.01')] },
  danger: { label: '問題', viewBox: '0 0 16 16', shapes: [DISC, MARK('M8 4.5v4M8 11h.01')] },
});

/** 状態の種類の一覧（表の順） */
export const STATUS_KINDS = Object.freeze(Object.keys(STATUS_ICONS));

/** 線のアイコン（ボタンの中で使う。aria-hidden。色は currentColor） */
export const GLYPHS = Object.freeze({
  close: { viewBox: '0 0 24 24', shapes: [['path', { d: 'M6 6l12 12M18 6 6 18' }]] },
  plus: { viewBox: '0 0 24 24', shapes: [['path', { d: 'M12 5v14M5 12h14' }]] },
  chevron: { viewBox: '0 0 24 24', shapes: [['path', { d: 'm6 9 6 6 6-6' }]] },
});

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function kindOf(kind) {
  if (!Object.hasOwn(STATUS_ICONS, kind)) throw new Error(`状態のアイコンの種類「${kind}」はありません（使えるのは ${STATUS_KINDS.join(' / ')}）`);
  return STATUS_ICONS[kind];
}

function glyphOf(name) {
  if (!Object.hasOwn(GLYPHS, name)) throw new Error(`線のアイコン「${name}」はありません`);
  return GLYPHS[name];
}

function attrsMarkup(attrs) {
  return Object.entries(attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
}

function shapesMarkup(shapes) {
  return shapes.map(([tag, attrs]) => `<${tag}${attrsMarkup(attrs)}/>`).join('');
}

function buildSvg(doc, cls, viewBox, a11y, shapes) {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', viewBox);
  for (const [k, v] of Object.entries(a11y)) svg.setAttribute(k, v);
  for (const [tag, attrs] of shapes) {
    const el = doc.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  }
  return svg;
}

function statusA11y(icon, { label, decorative }) {
  return decorative ? { 'aria-hidden': 'true', focusable: 'false' } : { role: 'img', 'aria-label': String(label ?? icon.label) };
}

/**
 * 状態のアイコンの SVG 文字列。label は aria-label（既定は種類の見出し）。decorative なら隣に文字があるので aria-hidden
 * @param {string} kind
 * @param {{label?: string, decorative?: boolean}} [opts]
 */
export function statusIconMarkup(kind, { label, decorative = false } = {}) {
  const icon = kindOf(kind);
  return `<svg class="tsk-icon tsk-icon--${kind}" width="16" height="16" viewBox="${icon.viewBox}"${attrsMarkup(statusA11y(icon, { label, decorative }))}>${shapesMarkup(icon.shapes)}</svg>`;
}

/**
 * 同じアイコンを DOM の要素で作る（innerHTML を使わない）
 * @param {Document} doc
 * @param {string} kind
 * @param {{label?: string, decorative?: boolean}} [opts]
 */
export function statusIconNode(doc, kind, { label, decorative = false } = {}) {
  const icon = kindOf(kind);
  return buildSvg(doc, `tsk-icon tsk-icon--${kind}`, icon.viewBox, statusA11y(icon, { label, decorative }), icon.shapes);
}

/**
 * アイコン＋文字の「状態」（.tsk-status）の HTML。文字を必ず添える（guidelines 01 の4）。label は esc して入れる
 * @param {string} kind
 * @param {string} label 画面に出す文字
 */
export function statusMarkup(kind, label) {
  kindOf(kind);
  const text = String(label ?? '');
  if (!text.trim()) throw new Error('状態には文字のラベルが要ります（アイコンだけにしない）');
  return `<span class="tsk-status tsk-status--${kind}">${statusIconMarkup(kind, { decorative: true })}<span class="tsk-status__label">${escAttr(text)}</span></span>`;
}

/** 線のアイコンの SVG 文字列（aria-hidden。ボタン側に aria-label を付ける） */
export function glyphMarkup(name) {
  const g = glyphOf(name);
  return `<svg class="tsk-glyph" width="16" height="16" viewBox="${g.viewBox}" aria-hidden="true" focusable="false">${shapesMarkup(g.shapes)}</svg>`;
}

/** 線のアイコンを DOM の要素で作る */
export function glyphNode(doc, name) {
  const g = glyphOf(name);
  return buildSvg(doc, 'tsk-glyph', g.viewBox, { 'aria-hidden': 'true', focusable: 'false' }, g.shapes);
}

// SPDX-License-Identifier: Apache-2.0
/**
 * 文字の日付欄。ブラウザの日付の欄（yyyy/mm/dd とカレンダー）をやめ、
 * ふつうの文字の欄に `YYYY-MM-DD` で入れる。欄の下に西暦と曜日を出すのは使う側。
 *
 * 決まり（何も import しない葉。画面のどこからでも同じ判定を使う）:
 *   - 読める値: `2026-09-08`。全角の数字・`/`・`.` 区切り・1桁の月日も読み（`2026/9/8`）、`2026-09-08` にそろえる
 *   - 暦に無い日（2026-02-31）は読めない
 *   - 読めない文字が入っているあいだは「打ちかけ」。使う側は前の値を保ち、**打った文字は消さない**
 *   - ブラウザの日付の欄（type=date）の打ちかけ（validity.badInput）も同じ入口で扱う（type=date の欄が残っている画面のため）
 */

/** 文字の日付欄の印（この属性を持つ input を日付の欄として扱う） */
export const DATE_TEXT_ATTR = 'data-date-text';
// 欄の中の見本は「例 2026-04-01」（YYYY-MM-DD の書式の記号は見せない）
export const DATE_TEXT_PLACEHOLDER = '例 2026-04-01';

const FULLWIDTH = /[０-９／．－]/g;
const toHalf = (s) => s.replace(FULLWIDTH, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

/**
 * 文字を `YYYY-MM-DD` にそろえる。読めなければ null、空なら ''
 * @param {unknown} value
 */
export function normalizeDateText(value) {
  const raw = toHalf(String(value ?? '').trim());
  if (raw === '') return '';
  const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(raw);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 日付の欄か（文字の日付欄、またはブラウザの日付の欄） */
export function isDateInput(el) {
  if (!el) return false;
  if (el.tagName !== undefined && String(el.tagName).toUpperCase() !== 'INPUT') return false;
  return el.type === 'date' || !!el.hasAttribute?.(DATE_TEXT_ATTR);
}

/** 打ちかけか（読めない文字が入っている／ブラウザの日付の欄の badInput） */
export function dateInputDraft(el) {
  if (!isDateInput(el)) return false;
  if (el.type === 'date') return !!el.validity?.badInput;
  return normalizeDateText(el.value) === null;
}

/** 欄から読む値（`YYYY-MM-DD` か ''）。打ちかけのときは ''（呼び出し側が前の値を保つ） */
export function dateInputValue(el) {
  if (!isDateInput(el)) return '';
  if (el.type === 'date') return el.validity?.badInput ? '' : String(el.value ?? '');
  return normalizeDateText(el.value) ?? '';
}

/** 打ちかけの欄の下に出す1行（読めない値は欄の誤りとして出す） */
export const dateDraftLine = (label = '日付') => `${label}は 2026-09-08 の形で入れてください`;

/** 文字の日付欄の属性（描く側が input に足す） */
export const dateTextAttrs = () => `type="text" inputmode="numeric" autocomplete="off" placeholder="${DATE_TEXT_PLACEHOLDER}" ${DATE_TEXT_ATTR}`;

/** 日付の欄を拾う選択子（ブラウザの日付の欄と文字の日付欄の両方） */
export const DATE_INPUT_SELECTOR = `input[type="date"], input[${DATE_TEXT_ATTR}]`;

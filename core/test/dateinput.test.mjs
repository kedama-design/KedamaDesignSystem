// 文字の日付欄（ui/dateinput.js）。
// 移した元: 登記議事録つくるさん _dev/test/ui8b.test.mjs の 89〜110 行（部品だけで完結する2つのテスト）。
// その後ろの、製品の画面（案件の入力の画面）に日付欄が出ることのテストは移していない。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDateText,
  isDateInput,
  dateInputDraft,
  dateInputValue,
  dateDraftLine,
  DATE_TEXT_ATTR,
  DATE_TEXT_PLACEHOLDER,
  dateTextAttrs,
  DATE_INPUT_SELECTOR,
} from '../ui/dateinput.js';

describe('日付の欄（ui/dateinput.js）', () => {
  it('YYYY-MM-DD に読み、全角・スラッシュ・1桁もそろえる。暦に無い日・形の違う文字は読めない', () => {
    assert.equal(normalizeDateText('2026-09-08'), '2026-09-08');
    assert.equal(normalizeDateText('２０２６／９／８'), '2026-09-08');
    assert.equal(normalizeDateText('2026.9.8'), '2026-09-08');
    assert.equal(normalizeDateText(''), '');
    assert.equal(normalizeDateText('2026-02-31'), null);
    assert.equal(normalizeDateText('2026-09'), null);
    assert.equal(normalizeDateText('令和8年9月8日'), null);
  });
  const el = (value, attrs = { [DATE_TEXT_ATTR]: '' }) => ({
    tagName: 'INPUT',
    type: 'text',
    value,
    hasAttribute: (k) => k in attrs,
  });
  it('文字の日付欄: 読めない文字のあいだは打ちかけ（値は空＝前の値を保つ）。読めたらそろえた値', () => {
    assert.ok(isDateInput(el('')));
    assert.equal(isDateInput(el('2026-09-08', {})), false, '印の無い文字の欄は日付の欄ではない');
    assert.equal(dateInputDraft(el('2026-09')), true);
    assert.equal(dateInputValue(el('2026-09')), '');
    assert.equal(dateInputDraft(el('2026/9/8')), false);
    assert.equal(dateInputValue(el('2026/9/8')), '2026-09-08');
    assert.equal(dateInputDraft(el('')), false);
    // ブラウザの日付の欄（type=date）も同じ入口
    assert.equal(
      dateInputDraft({
        tagName: 'INPUT',
        type: 'date',
        value: '',
        validity: { badInput: true },
        hasAttribute: () => false,
      }),
      true,
    );
    assert.match(dateDraftLine('就任日'), /^就任日は 2026-09-08 の形で入れてください$/);
  });
});

describe('日付の欄の描き方の決まり（ui/dateinput.js）', () => {
  it('文字の日付欄の属性は type="text"・数字のキーボード・見本「例 2026-04-01」・印の属性', () => {
    assert.equal(DATE_TEXT_PLACEHOLDER, '例 2026-04-01');
    assert.equal(
      dateTextAttrs(),
      `type="text" inputmode="numeric" autocomplete="off" placeholder="例 2026-04-01" ${DATE_TEXT_ATTR}`,
    );
    assert.equal(DATE_INPUT_SELECTOR, 'input[type="date"], input[data-date-text]');
  });
});

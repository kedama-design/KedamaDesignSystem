// 主ボタンの hover・active（自前の名前・自前の決め方）。値はテストに書き写さず、ui/tokens.css を読んで決め方と比べる。
// 決め方: インク色（--ui-action-primary）を sRGB 8bit の各成分で、hover は白へ 12%、active は黒へ 25% 混ぜる。端数は Math.round。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ourTokens,
  guideJson,
  norm,
  contrast,
  mixToWhite,
  mixToBlack,
  hexToRgb,
  rgbToHex,
} from './helpers.mjs';

describe('主ボタンの hover・active', () => {
  it('主ボタンの地はインク色（tokens.json の action.primary）で、文字は on-primary', () => {
    const o = ourTokens();
    const j = guideJson().color.action.primary;
    assert.equal(norm(o.get('--ui-action-primary')), norm(j.value));
    assert.equal(norm(o.get('--ui-action-on-primary')), norm(j.on));
  });

  it('hover はインク色を白へ 12%、active は黒へ 25% 混ぜた値', () => {
    const o = ourTokens();
    const ink = o.get('--ui-action-primary');
    assert.equal(norm(o.get('--ui-action-primary-hover')), mixToWhite(ink, 0.12));
    assert.equal(norm(o.get('--ui-action-primary-active')), mixToBlack(ink, 0.25));
  });

  it('決め方の道具そのもの: 端と、0.5 の切り上げ', () => {
    assert.equal(mixToWhite('#000000', 1), '#ffffff');
    assert.equal(mixToBlack('#808080', 0), '#808080');
    assert.equal(mixToBlack('#808080', 1), '#000000');
    // 38 × 0.75 = 28.5 → 29（切り上げ）。偶数への丸めなら 28（#1c…）になるので、丸め方を固定する
    assert.equal(mixToBlack('#260000', 0.25), '#1d0000');
    assert.deepEqual(hexToRgb(rgbToHex([1, 2, 3])), [1, 2, 3]);
  });

  it('on-primary の文字は、通常・hover・active のどの地でも 4.5:1 以上', () => {
    const o = ourTokens();
    const on = o.get('--ui-action-on-primary');
    for (const name of [
      '--ui-action-primary',
      '--ui-action-primary-hover',
      '--ui-action-primary-active',
    ]) {
      const r = contrast(on, o.get(name));
      assert.ok(r >= 4.5, `${name} と on-primary の比 ${r.toFixed(2)} が 4.5 未満`);
    }
  });

  it('hover は通常より明るく、active は通常より暗い（押した感じの向きがそろう）', () => {
    const o = ourTokens();
    const sum = (hex) => hexToRgb(hex).reduce((a, b) => a + b, 0);
    assert.ok(sum(o.get('--ui-action-primary-hover')) > sum(o.get('--ui-action-primary')));
    assert.ok(sum(o.get('--ui-action-primary-active')) < sum(o.get('--ui-action-primary')));
  });
});

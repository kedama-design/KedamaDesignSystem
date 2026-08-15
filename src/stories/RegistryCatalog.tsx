import React from 'react';
import registry from '../../registry.json';
import pkg from '../../package.json';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../index';

/**
 * レジストリのショーケース（Tier 2 の人間向け紹介面）。
 *
 * 仕様書 §2.1 は「人間が見る紹介ページ」と「`shadcn add` が読みに行く静的 JSON」を
 * 同じデプロイに置くとしている。§7 Phase B はその実現手段を
 * 「`apps/showcase` を足す軽量 monorepo」**または**「既存 Storybook に
 * `/r/*.json` の静的配信を同居させる形」の二択にしており、こちらは後者を採った。
 * 配信は `.storybook/main.ts` の `staticDirs`、紹介面がこのページである。
 *
 * ## `registry.json` を直接読む理由
 *
 * 一覧を手で書くと、アイテムを足したときに**片方だけ古くなる**。この基盤が
 * 繰り返し踏んできた失敗（撤回済み条項を根拠にした実装、廃止済み Sheet が
 * 一覧に残る）と同じ形なので、構造的に起こらないようにする。
 * ここが読むのは生成物 `public/r/*.json` ではなく**ソースの `registry.json`**。
 * 生成物は .gitignore 対象で、ビルド前は存在しないため。
 *
 * 追加コマンドの URL も `registry.json` の `homepage` から組み立てる。
 * 公開先が変わったら1箇所直せば全部が追従する。
 */

interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  docs?: string;
  files: RegistryFile[];
}

const items = registry.items as RegistryItem[];

/** 公開されている `r/<name>.json` の URL */
export function registryItemUrl(name: string): string {
  return new URL(`r/${name}.json`, registry.homepage).href;
}

/**
 * 消費側に見せるコマンドの接頭辞。
 *
 * **`shadcn add …` とだけ書かない。** 消費側は CLI を devDependency に持っていないので、
 * そのままでは実行できない。かといって `npx shadcn` や `@latest` にすると版が動き、
 * 「何で取り込んだのか」が残らない（提供側で `npx` を使わないのと同じ理由）。
 *
 * - **提供側**（このリポジトリ）… 固定の devDependency（`pnpm build:registry`）
 * - **消費側** … 固定版を `pnpm dlx`
 *
 * 版は package.json から読む。ここに数字を書き写すと、CLI を上げたときに
 * ドキュメントだけ古くなる。
 */
const SHADCN_VERSION = pkg.devDependencies.shadcn;
const SHADCN_DLX = `pnpm dlx shadcn@${SHADCN_VERSION}`;

/** `registry:component` のような type から接頭辞を落として読みやすくする */
function shortType(type: string): string {
  return type.replace(/^registry:/, '');
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-2xs leading-relaxed font-medium tracking-wide text-fg-muted uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

/** 折り返しても読める、選択しやすいコマンド表示 */
function Command({ children }: { children: string }): React.JSX.Element {
  return (
    <code className="block rounded-md border border-border-muted bg-subtle px-3 py-2 font-mono text-xs break-all text-fg-default">
      {children}
    </code>
  );
}

/**
 * Tier 0 と Tier 2 の受け取り方の違い。
 *
 * MDX ではなくここに置く理由が2つある。
 *
 * 1. **この Storybook の MDX は GFM のパイプ表を解釈しない。** 既存ページ
 *    （DesignPrinciples.mdx）も JSX の表を書いている
 * 2. **Prettier が MDX 中の `{/* … *\/}` を markdown の強調として書き換える。**
 *    `{/_ … _/}` になってページごと壊れた（実測: Storybook が 500 を返した）。
 *    表を TSX へ移せば、注記は通常の JSDoc で書けてこの問題が起きない
 *
 * Tier 0 の `Table` は内部で `overflow-x-auto` の器を持つので、横に長くても
 * ページごと溢れない（ui/table.tsx）。素の `<table>` を MDX に書いたときは
 * 390px 幅でページが 547px に広がっていた。
 */
export function TierComparison(): React.JSX.Element {
  const rows: [string, React.ReactNode, React.ReactNode][] = [
    [
      '受け取り方',
      <>
        <strong>npm</strong>（<code>@kedama-design/design-system</code>）
      </>,
      <>
        <strong>レジストリ</strong>（<code>shadcn add &lt;URL&gt;</code>）
      </>,
    ],
    ['中身', 'Button / Card / Drawer / Table / Toast / トークン', 'AppShell 一式など、画面の骨格'],
    [
      '更新',
      'バージョンを上げると自動で追従する',
      <>
        <strong>コピーされる。</strong> 以後は消費側の持ち物
      </>,
    ],
    [
      '手を入れてよいか',
      '入れない（全プロダクトで挙動を揃えるため）',
      <>
        <strong>入れてよい。</strong> そのための配布形式
      </>,
    ],
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead>Tier 0（基礎プリミティブ）</TableHead>
          <TableHead>Tier 2（複合ブロック）</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([label, tier0, tier2]) => (
          <TableRow key={label}>
            <TableCell className="font-medium whitespace-nowrap">{label}</TableCell>
            <TableCell>{tier0}</TableCell>
            <TableCell>{tier2}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function RegistryCatalog(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      {items.map((item) => (
        <Card key={item.name}>
          <CardHeader>
            <CardTitle>
              <span className="flex flex-wrap items-center gap-2">
                {item.title ?? item.name}
                <Badge>{shortType(item.type)}</Badge>
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-6">
              {item.description != null && (
                <p className="text-sm leading-relaxed text-fg-muted">{item.description}</p>
              )}

              <Field label="追加する">
                <Command>{`${SHADCN_DLX} add ${registryItemUrl(item.name)}`}</Command>
              </Field>

              <Field label="取り込み済みのものと差分を見る">
                <Command>{`${SHADCN_DLX} add ${registryItemUrl(item.name)} --diff`}</Command>
              </Field>

              {/* `dependencies` は shadcn add が自分でインストールを試みる。
                  「別途インストールが要る」は実挙動と食い違うので書かない。 */}
              {item.dependencies != null && item.dependencies.length > 0 && (
                <Field label="shadcn が追加する npm 依存">
                  <div className="flex flex-wrap gap-2">
                    {item.dependencies.map((dep) => (
                      <Badge key={dep}>{dep}</Badge>
                    ))}
                  </div>
                </Field>
              )}

              <Field label={`コピーされるファイル（${item.files.length}）`}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>コピー先</TableHead>
                      <TableHead>種別</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.files.map((file) => (
                      <TableRow key={file.path}>
                        <TableCell className="font-mono text-xs">
                          {file.target ?? file.path}
                        </TableCell>
                        <TableCell className="text-xs text-fg-muted">
                          {shortType(file.type)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Field>

              {item.docs != null && (
                <Field label="メモ">
                  <p className="text-sm leading-relaxed text-fg-muted">{item.docs}</p>
                </Field>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** レジストリ全体の配信元。ページ冒頭で使う */
export function RegistryEndpoint(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Field label="レジストリの索引">
        <Command>{new URL('r/registry.json', registry.homepage).href}</Command>
      </Field>
      <Field label="アイテム数">
        <p className="text-sm text-fg-default">{items.length}</p>
      </Field>
    </div>
  );
}

# checkout-ui-custom — Guia de Desenvolvimento

## O que é este projeto

Este é o builder `checkout-ui-custom` do app VTEX IO `checkout-ui-settings`. Ele **não é** um app de Store Framework com blocks — é o mecanismo de customização do **checkout legado/nativo (SmartCheckout)** da VTEX: o build gera dois arquivos únicos, [checkout6-custom.js](checkout6-custom.js) e [checkout6-custom.css](checkout6-custom.css), que são injetados como `<script>`/`<style>` crus dentro do template do checkout nativo (configurado no admin em Checkout > Configurações de template).

Implicações práticas dessa arquitetura:

- **Não há CSS Handles nem component schema de Site Editor aqui.** Esses recursos (`vtex.css-handles`, `schema` para o Site Editor) só existem para blocks de apps Store Framework, resolvidos pelo builder da VTEX IO. Este projeto usa webpack próprio e é injetado como script solto no checkout — não faz parte da árvore de render de blocks da VTEX. Não tente importar `vtex.css-handles` nem exportar `schema` em componentes daqui.
- O React é montado manualmente via `ReactDOM.render` em containers criados/injetados no DOM do checkout nativo (ver [renderCartComponent.tsx](src/scripts/renderCartComponent.tsx)), não via roteamento de blocks.
- O bundle final precisa ser único (sem `splitChunks`) e o mais leve possível — é isso que o `webpack.config.js` já garante (`usedExports`, `concatenateModules`, sem source maps, TerserPlugin com `drop_console`).

## Stack

- React 18 + TypeScript (JSX automático, sem `import React` necessário)
- SCSS (Sass), compilado via `sass-loader` + `css-loader` + `postcss-loader` (autoprefixer, cssnano) + `MiniCssExtractPlugin`
- Babel (não `tsc`) para transpilar — o `ForkTsCheckerWebpackPlugin` cuida só da checagem de tipos, em paralelo
- `useOrderForm` ([src/hooks/useOrderForm.ts](src/hooks/useOrderForm.ts)) é o hook que escuta os eventos jQuery do checkout (`orderFormUpdated.vtex`, etc.) e é a única ponte real com o `window.vtexjs`

## Layout do `src/`

```
src/
├── checkout6-custom.tsx    # entrypoint JS (importa os scripts de bootstrap)
├── checkout6-custom.scss   # entrypoint CSS (@import dos tokens globais)
├── scripts/                # bootstrap/cola com o checkout nativo (não são componentes)
│   ├── main.jsx            # esconde header/footer nativos via jQuery
│   └── renderCartComponent.tsx  # monta o React (ReactDOM.render) no DOM do checkout
├── components/             # todos os componentes React
├── hooks/                  # hooks genéricos e reutilizáveis (useOrderForm, useShippingData)
├── utils/                  # utilitários puros (ex.: currency.ts)
└── styles/                 # tokens e SCSS global (_tokens, _main)
```

> Os componentes ficam em `src/components/` (nível de topo), **não** dentro de `src/scripts/`. `src/scripts/` guarda só os scripts de inicialização que fazem a ponte com o checkout nativo.

### Aliases de import

Diretórios cross-boundary (importados de vários pontos da árvore) têm aliases, para evitar `../../../` frágeis. Precisam estar espelhados **nos dois lugares**: `resolve.alias` do [webpack.config.js](webpack.config.js) e `compilerOptions.paths` do [tsconfig.json](tsconfig.json).

| Alias          | Aponta para       |
| -------------- | ----------------- |
| `~components/` | `src/components/` |
| `~hooks/`      | `src/hooks/`      |
| `~utils/`      | `src/utils/`      |

```tsx
import { AlertCircleIcon } from '~components/Icons';
import useShippingData from '~hooks/useShippingData';
import { formatCurrency } from '~utils/currency';
```

Imports **dentro do mesmo domínio** (ex.: um subcomponente do Cart importando o `CartContext`) continuam relativos (`../../context/CartContext`) — são curtos e coesos. Use alias só quando o import cruza a fronteira do diretório.

## Estrutura de componentes

Cada componente novo (ou refatorado) fica em sua própria pasta dentro de `src/components/`, com três arquivos:

```
src/components/MeuComponente/
├── MeuComponente.tsx           # Componente principal
├── MeuComponente.module.scss   # Estilos com CSS Modules
└── MeuComponente.types.ts      # Tipos TypeScript do componente
```

Componentes que têm subcomponentes internos (como `Cart`) mantêm a subpasta `components/` já existente, mas cada subcomponente segue o mesmo padrão de arquivos (trio `.tsx`/`.module.scss`/`.types.ts`, mais um hook `use<Nome>.ts` quando há lógica não-trivial):

```
src/components/Cart/
├── Cart.tsx
├── Cart.module.scss
├── context/
│   └── CartContext.tsx
└── components/
    ├── Header/
    │   ├── Header.tsx
    │   └── Header.module.scss
    ├── ShippingCalculator/
    │   ├── ShippingCalculator.tsx
    │   ├── ShippingCalculator.module.scss
    │   └── useShippingCalculator.ts
    └── ...
```

`.types.ts` só é criado quando o componente realmente recebe props de fora (átomos/moléculas como `QtySelector`, `CouponBadge`, `ShippingOption`); componentes que só consomem `CartContext` via `useCart()` não precisam de um `.types.ts` vazio.

Lógica não-trivial de manipulação do orderForm/shippingData mora em hooks genéricos em `src/hooks/` (ex.: `useShippingData` concentra cálculo de frete e seleção de SLA); o `CartContext` só **compõe** esses hooks e centraliza o estado do carrinho.

Todo o Cart já foi migrado para esse padrão (SCSS Modules + hooks + ícones extraídos para `src/components/Icons/`) — `src/styles/_main.scss` hoje só importa os tokens globais. Ver a skill [`/new-component`](.claude/skills/new-component/SKILL.md) para o passo a passo completo ao criar um componente novo.

### Wrappers e divs estruturais — nunca deixar sem classe "por padrão"

Ao extrair um bloco de JSX que antes vivia dentro de uma classe global BEM (`.vtex-order-summary`, `.vtex-cart-card`, etc.) para um componente/CSS Module novo, **confira se aquela classe tinha propriedades CSS diretas no seletor raiz** (background, padding, border, box-shadow, position...) além das regras aninhadas (`&__filho`). Se tinha, o componente novo **precisa de uma classe própria no elemento raiz** reproduzindo exatamente essas propriedades — não é seguro assumir que "a classe só existia para agrupar os filhos". Uma div raiz sem `className` é, na prática, uma suspeita de estilo perdido: antes de aceitar uma div (ou wrapper) sem classe, confirme explicitamente que o elemento equivalente no CSS antigo não tinha estilo próprio (só filhos via `&__algo`), documentando isso quando não for óbvio.

Fragmentos (`<>...</>`/`Fragment`) só devem substituir uma div quando a div *precisaria* existir apenas para agrupar itens que são filhos diretos de um container flex/grid do pai (ex.: agrupar `step` + `divider` dentro de um `.stepper` com `display: flex`, onde uma div extra quebraria o layout dos itens). Fora desse caso, prefira um elemento real com classe do CSS Module a um Fragment "para simplificar".

## SCSS Modules

O `css-loader` (v6) já habilita CSS Modules automaticamente para qualquer arquivo `*.module.scss` — não é necessário alterar o `webpack.config.js`.

Os nomes de classe (`modules.localIdentName` do `css-loader`, em `webpack.config.js`) variam conforme o `--mode` da CLI:

- `yarn dev` (`--mode=development`): legível — uma classe `.title` em `Header.module.scss` compila para `.Header-module__title--a1b2c`. Dá pra olhar o devtools e saber exatamente qual componente/classe gerou aquele estilo, em vez de um hash opaco.
- `yarn build` (`--mode=production`): só hash curto (ex.: `._2L3cHm`) — não expõe a estrutura interna dos componentes no CSS público, e o arquivo final fica um pouco menor.

Essa branch depende de `argv.mode` (o valor literal passado na CLI), não do `mode:` fixo do objeto de config (que continua sempre `'production'` de propósito — ver comentário em `optimization.minimize`). Se for depurar um problema de estilo, garanta que está rodando via `yarn dev`/`--mode=development` antes de olhar o devtools, senão vai ver só hashes.

Convenções:

- Nomeie classes em `camelCase` dentro do módulo (`.cartItem`, `.cartItem__title` não é necessário — o hashing do CSS Modules já garante escopo, então BEM interno é opcional; prefira nomes descritivos simples).
- Importe como objeto e use via `styles.algo`:

```tsx
import styles from './CartItem.module.scss';

<div className={styles.container}>
  <span className={styles.title}>{name}</span>
</div>
```

- Para combinar classes condicionalmente, use template literal simples (o projeto não tem `clsx`/`classnames` como dependência — só adicione se a necessidade de composição crescer muito):

```tsx
className={`${styles.step} ${isActive ? styles.stepActive : ''}`}
```

### Resets globais NUNCA vão dentro de um `*.module.scss`

Um reset cascade-sensível — algo como `* , *::before, *::after { padding: 0; margin: 0 }`, aplicado sobre um container amplo (ex.: o shell do app) — depende de vir **antes** de qualquer regra de componente no CSS final. Um `*.module.scss`, porém, não tem ordem de saída garantida no bundle: a posição dele no CSS final segue a ordem do **grafo de import do JS** (quem importa quem, e em que ordem), não a ordem em que você escreveu o arquivo. Isso já causou um bug real neste projeto: o reset universal do shell (`.app *, *::before, *::after { padding: 0 }`) foi movido para dentro de `Cart.module.scss`, e como esse module acabou sendo emitido *depois* das regras de `.card` no CSS final (mesma especificidade — uma classe + universal, empate ganho por quem vem depois), ele zerava o padding de **todos os containers** do carrinho, sem nenhum erro de build.

Regra: qualquer reset baseado em seletor universal (`*`, `*::before`, `*::after`) que precisa valer para "tudo dentro de X" — não é o estilo de um componente específico, é uma regra de cascata cuja posição no arquivo final decide quem ganha o empate de especificidade — **não vai em `*.module.scss` nem em `_main.scss`**. Ele é injetado direto no CSS final pelo `InjectGlobalResetPlugin`, definido em `webpack.config.js` (constante `GLOBAL_RESET_CSS`). Esse plugin faz `prepend` do texto no asset `.css` num estágio anterior à minificação, então a posição é garantida pelo webpack — não depende da ordem de import de nenhum componente React, nem da ordem de itens no `entry`. **`GLOBAL_RESET_CSS` é a única fonte desse reset — não duplicar em nenhum SCSS.**

O elemento que esse reset teoricamente teria como alvo (hoje, a raiz de `Cart.tsx`) carrega uma classe literal de propósito (`"vtex-cart-app"`, não hasheada) só para servir de âncora do seletor `.vtex-cart-app *` que vive no webpack.config.js — isso é combinado com a classe normal do CSS Module (`styles.app`) para as propriedades que o próprio `.app` possui (fundo, padding, tipografia), que não têm esse problema de ordem e continuam no `Cart.module.scss` normalmente. Resumindo: **só a regra `*`/`::before`/`::after` sai do CSS Modules; todo o resto do componente continua no padrão normal.**

- Tokens globais (`src/styles/_tokens.scss`) continuam sendo a fonte de verdade para cores, espaçamento, tipografia e raios de borda. Dentro de um `.module.scss`, importe-os com `@use`:

```scss
@use '../../../styles/tokens' as *;

.container {
  padding: $space-m;
  border-radius: $radius-card;
}
```

Se `_tokens.scss` ainda expõe apenas CSS custom properties (`--vtex-pink`, etc.) e não variáveis Sass, prefira consumir via `var(--vtex-pink)` diretamente no module — não duplique valores hardcoded.

### `!important` é proibido — vença o CSS nativo por especificidade

**Nunca** use `!important` em nenhum `*.module.scss` nem `_main.scss`. O motivo real de ele aparecer aqui é vencer o CSS do checkout nativo (SmartCheckout) que estiliza elementos crus como `button` e `input`. A forma correta de ganhar esse embate é por **especificidade**, escopando os seletores do componente sob a âncora literal `.vtex-cart-app` (a classe não-hasheada aplicada no root do app em `Cart.tsx`, a mesma usada pelo reset global). Use `:global(.vtex-cart-app)` no `.module.scss`:

```scss
// vence `button`/`.template-cart button` etc. sem !important
:global(.vtex-cart-app) {
  .button {
    height: 40px;
    background: var(--color-muted-1);

    &:hover:not(:disabled) {
      background: var(--color-muted-2);
    }
  }
}
```

Isso compila para `.vtex-cart-app .Button-module__button--hash` (duas classes) — especificidade acima de qualquer seletor nativo de elemento — e as classes internas continuam exportadas normalmente (`styles.button`). Regras que **não** disputam com o nativo (spinner, animações, `@keyframes`, wrappers próprios) ficam no nível raiz do arquivo, sem a âncora.

Coisas que **não** precisam de override por especificidade: `box-sizing: border-box`, `margin: 0` e `padding: 0` já são aplicados a tudo dentro de `.vtex-cart-app` pelo reset global (`GLOBAL_RESET_CSS` em `webpack.config.js`) — não os repita nos módulos.

## TypeScript

- Props e tipos exclusivos do componente vão em `MeuComponente.types.ts`, exportados e importados no `.tsx`:

```ts
// CartItem.types.ts
export interface CartItemProps {
  index: number;
  item: CartItem;
  onRemove: (index: number) => void;
}
```

```tsx
// CartItem.tsx
import type { CartItemProps } from './CartItem.types';

const CartItem: React.FC<CartItemProps> = ({ index, item, onRemove }) => { ... };
```

- Tipos compartilhados entre vários componentes (ex.: `CartItem`, `ShippingOption`) ficam centralizados perto do contexto que os produz (hoje em `CartContext.tsx`) — só extraia para um arquivo `types.ts` de nível superior se mais de uma feature (fora do Cart) passar a precisar deles.
- Evite `any`. O projeto já usa `(window as any).vtexjs` como escape hatch para o global não tipado — mantenha esse padrão isolado (não propague `any` para dentro da lógica dos componentes).

## Regras específicas do ambiente de checkout

- **Nunca acesse `window.vtexjs` sem guarda.** Siga o padrão já usado em `CartContext.tsx`: cheque `typeof window !== 'undefined' && !!(window as any).vtexjs` antes de qualquer chamada, com fallback de mock para desenvolvimento local (`isMock`).
- **Não quebre o checkout nativo.** Este script roda dentro da página real do checkout — erros não tratados, `throw` fora de try/catch em handlers de evento, ou manipulação direta de elementos nativos fora do que já é feito em `renderCartComponent.tsx` podem quebrar o fluxo de compra do lojista.
- **Bundle único, sem code splitting.** Não importe bibliotecas pesadas sem necessidade; o `performance.maxAssetSize` do webpack já está configurado como alerta (512kb).
- **Sem `console.log` em produção** — o Terser já remove `console`/`debugger`, mas evite depender disso durante o dev; limpe antes de commitar.

## Comandos

```bash
yarn dev     # webpack --watch --mode=development
yarn build   # webpack --mode=production (gera checkout6-custom.js/css)
```

Após o build, o app é publicado/linkado como um app VTEX IO normal (`vtex link` / `vtex publish`) — o builder `checkout-ui-custom` do manifest é quem sabe que esses dois arquivos devem ser aplicados como customização do template de checkout.

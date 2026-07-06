---
name: new-component
description: Cria um novo componente do checkout-ui-custom seguindo atomic design e os padrões do projeto (SCSS Modules, hooks de lógica, sem CMS/schema). Use quando o usuário pedir para criar um novo componente, átomo, molécula ou feature do carrinho/checkout.
---

# new-component

Cria um novo componente do **checkout-ui-custom** seguindo atomic design e os padrões definidos no [CLAUDE.md](../../CLAUDE.md) do projeto.

> Contexto do projeto: este não é um app de Store Framework/FastStore. É o builder `checkout-ui-custom`, que compila para `checkout6-custom.js/css` e é injetado como script cru no checkout nativo da VTEX. **Não existe CMS, Site Editor, schema nem CSS Handles aqui** — se algum passo abaixo parecer familiar de FastStore mas remeter a CMS, é porque foi deliberadamente removido/adaptado. Ver seção "Diferenças em relação ao FastStore" no fim.

## Uso

```
/new-component <NomeDoComponente> [atom|molecule|feature]
```

**Exemplos:**
- `/new-component QtySelector atom`
- `/new-component CouponBadge molecule`
- `/new-component ShippingCalculator feature`

---

## O que fazer

Você receberá o nome do componente e, opcionalmente, o nível atômico (`atom`, `molecule`, `feature`). Se o nível não for informado, pergunte ao usuário.

### Atomic Design — regras de composição

| Nível | O que é | Exemplos neste projeto |
|-------|---------|---------|
| **atom** | Elemento UI indivisível, sem dependências internas de outros componentes do projeto | Button, Spinner, Tag, QtySelector, SecurityBadge |
| **molecule** | Composição de atoms com um propósito funcional único | CartItem, CouponBadge, ShippingOption |
| **feature** | Seção completa de UI, composta de molecules/atoms, montada diretamente no DOM do checkout via um `render<Feature>Component.tsx` (equivalente a um "organism", mas sem CMS por trás) | Cart, Header, OrderSummary, ShippingCalculator |

---

## Passos de criação

### 1. Identificar onde criar

Todos os componentes ficam em `src/scripts/components/`.

- **atoms/molecules reutilizados por mais de uma feature** → `src/scripts/components/<NomeDoComponente>/`
- **molecules que só existem dentro de uma feature** → `src/scripts/components/<Feature>/components/<NomeDoComponente>/` (padrão já usado por `Cart/components/`)
- **features** → `src/scripts/components/<NomeDoComponente>/` na raiz, com seu próprio `context/` se precisar de estado compartilhado entre subcomponentes (ver `Cart/context/CartContext.tsx` como referência)

Estrutura de referência (arquivos com `*` são opcionais, criados só quando necessário):

```
src/scripts/components/<NomeDoComponente>/
├── <NomeDoComponente>.tsx          # apresentação (View) — só JSX e composição
├── <NomeDoComponente>.types.ts     # contratos (interfaces/props)
├── <NomeDoComponente>.module.scss  # estilos com CSS Module
└── use<NomeDoComponente>.ts        # * lógica/estado/efeitos (quando houver)
```

**Princípio geral: separar apresentação de lógica.** O `.tsx` deve ser o mais declarativo possível. Estado, efeitos, handlers, e integração com `window.vtexjs`/`useOrderForm` vão para um hook (ver passo 3.1). Ícones SVG inline vão para `src/scripts/components/Icons/` (ver passo 3.2).

### 2. Criar `<NomeDoComponente>.types.ts`

- Exportar a interface principal como `<NomeDoComponente>Props`
- Props devem ter nomes claros e descritivos em camelCase
- Usar tipos primitivos e interfaces — evitar `any` (a única exceção tolerada no projeto é o escape hatch `(window as any).vtexjs`, isolado dentro de hooks/context, nunca propagado para props de componente)
- Props opcionais com `?` quando tiverem valor padrão
- Para **features** conectadas ao checkout: as props normalmente não vêm de fora (não há CMS/schema passando config) — o componente consome estado via um hook/context próprio (`useCart`, ou um novo `use<Feature>` análogo). Só declare props quando a feature realmente for parametrizável pelo componente pai.

```ts
// Exemplo atom
export interface QtySelectorProps {
  value: number
  min?: number
  max?: number
  disabled?: boolean
  onChange: (value: number) => void
}

// Exemplo molecule
export interface CouponBadgeProps {
  code: string
  onRemove: () => void
}
```

### 3. Criar `<NomeDoComponente>.tsx`

Estrutura obrigatória:

```tsx
import type { <NomeDoComponente>Props } from './<NomeDoComponente>.types'
import styles from './<NomeDoComponente>.module.scss'

function <NomeDoComponente>({ prop1, prop2 }: <NomeDoComponente>Props) {
  return (
    <div className={styles.<nomeDoComponente>}>
      {/* conteúdo */}
    </div>
  )
}

export default <NomeDoComponente>
```

Regras de qualidade:
- Componente funcional (nunca classe)
- Desestruturar props diretamente na assinatura
- Sem `React.FC` — tipar via interface diretamente. (Componentes antigos do projeto ainda usam `React.FC`; ao criar um novo, siga o padrão sem `React.FC`. Não é necessário migrar os antigos só por isso — migre-os quando forem tocados por outro motivo, seguindo a mesma política incremental do CLAUDE.md.)
- Sem `export default` inline quando o componente tiver lógica (legibilidade)
- `className` sempre usando `styles.<nome>` do CSS Module
- Sem comentários óbvios — só adicionar quando o comportamento for não-óbvio
- Para **features**: sempre tratar o caso `isMock`/ausência de `window.vtexjs` (ver `CartContext.tsx`) — nunca assumir que o ambiente VTEX real está disponível

### 3.1 Extrair lógica para um hook `use<NomeDoComponente>.ts`

**Sempre que o componente tiver lógica não-trivial** — estado (`useState`), efeitos (`useEffect`), refs, handlers de teclado/mouse, controle aberto/fechado, chamadas a `window.vtexjs`/`useOrderForm` — essa lógica **deve sair do `.tsx`** e ir para um hook customizado na própria pasta do componente.

Objetivo: o `.tsx` fica só com apresentação (View) e o hook concentra o comportamento (Controller), ficando testável isoladamente.

```ts
// src/scripts/components/<NomeDoComponente>/use<NomeDoComponente>.ts
import { useState } from 'react'

import type { <NomeDoComponente>Option } from './<NomeDoComponente>.types'

interface Use<NomeDoComponente>Params {
  // só o que a lógica precisa receber do componente
}

// Funções puras (sem hooks) ficam no escopo do módulo, fora do hook
function helperPuro(/* ... */) {
  /* ... */
}

export function use<NomeDoComponente>(params: Use<NomeDoComponente>Params) {
  const [isOpen, setIsOpen] = useState(false)
  // estado, efeitos, refs, handlers...

  return {
    // estado e handlers que a View consome
  }
}
```

```tsx
// <NomeDoComponente>.tsx — só renderiza
function <NomeDoComponente>(props: <NomeDoComponente>Props) {
  const { isOpen, /* ... */, handleClick } = use<NomeDoComponente>({ /* ... */ })

  return <div>{/* JSX usando o que o hook devolveu */}</div>
}
```

Regras:
- Nome do arquivo e do hook: `use<NomeDoComponente>` (camelCase, prefixo `use`)
- Funções puras (sem hooks) vão no escopo do módulo, não dentro do hook
- O hook retorna um objeto nomeado (estado + handlers), nunca um array posicional grande
- Átomos puramente visuais (sem estado) **não** precisam de hook — não criar por criar
- Para features que integram com o checkout, prefira consumir o `CartContext` (`useCart()`) já existente em vez de duplicar acesso a `window.vtexjs`; só crie um contexto novo se a feature for independente do carrinho

### 3.2 Extrair ícones SVG para `src/scripts/components/Icons/`

**Nunca deixar `<svg>` inline dentro do JSX de um componente.** Todo ícone de UI (usado dentro de JSX, com `currentColor`) vira um componente próprio em `src/scripts/components/Icons/`, com um barrel `index.ts`.

> Não confundir com `src/icons/` (alias `~icons`), que guarda **assets SVG estáticos** usados como imagem/background (ex.: `background.svg`), carregados via `asset/inline` no webpack. Isso é outra coisa — continua existindo e não muda.

```
src/scripts/components/Icons/
├── ChevronDownIcon.tsx
├── SecurityIcon.tsx
└── index.ts            # barrel: export { default as ... }
```

```tsx
// src/scripts/components/Icons/SecurityIcon.tsx
import type { SVGProps } from 'react'

function SecurityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default SecurityIcon
```

```ts
// src/scripts/components/Icons/index.ts
export { default as SecurityIcon } from './SecurityIcon'
```

Regras:
- Nome do componente/arquivo termina em `Icon` (ex.: `SecurityIcon`)
- Tipar com `SVGProps<SVGSVGElement>` e espalhar `{...props}` para permitir `className`, `width`, etc.
- Usar `stroke="currentColor"`/`fill="currentColor"` para herdar a cor via CSS (`color`)
- `aria-hidden="true"` por padrão (ícone decorativo); deixar o consumidor sobrescrever via props
- Ícones do logo (marca, não decorativo) mantêm `aria-hidden` removido ou `role="img"` + `aria-label`, conforme o caso

### 3.3 Nunca deixar uma div/wrapper estrutural sem classe "por padrão"

Ao migrar um bloco de JSX que antes vivia sob uma classe global BEM para este padrão novo, **é fácil perder estilo sem gerar nenhum erro de build** — o TypeScript e o webpack compilam normalmente, só o resultado visual quebra (padding, sombra, fundo de "card" desaparecendo). Isso já aconteceu numa refatoração real neste projeto: um componente perdeu `background`/`padding`/`box-shadow` porque a div raiz virou `<div>` sem `className`.

Regra: antes de deixar uma div (ou de simplificar/remover um wrapper) sem `className`, confira explicitamente a classe global equivalente no CSS antigo (ou no componente que está sendo substituído):

- Se a classe **só tinha regras aninhadas para os filhos** (`&__titulo`, `&__form`, etc.) e nenhuma propriedade direta no seletor raiz, a div sem classe é segura — o "estilo" dela nunca existiu, só existia nos filhos.
- Se a classe tinha **qualquer propriedade direta no seletor raiz** (`background`, `padding`, `border`, `box-shadow`, `position`, `display`, etc.), essa propriedade precisa migrar para uma classe no `.module.scss` do componente e ser aplicada no elemento raiz — não é opcional, é a aparência do componente.

Na dúvida, **não assuma** — grite/pergunte ou releia o CSS de origem antes de decidir que uma div "não precisa" de classe.

**Fragments (`<>...</>`/`Fragment`) seguem a mesma cautela.** Só use um Fragment no lugar de um elemento real quando ele for estritamente necessário para não quebrar um layout flex/grid do pai (ex.: agrupar um `step` + um `divider` que precisam ser filhos diretos de um container `display: flex`, onde inserir uma div extra ali mudaria o comportamento do flex). Fora desse caso específico, prefira sempre um elemento com uma classe do CSS Module — não use Fragment "para simplificar" ou "porque não precisa de estilo agora". Se usar um Fragment por esse motivo de layout, deixe isso óbvio (nome de variável, comentário curto se não for óbvio) para quem for revisar depois.

### 4. Criar `<NomeDoComponente>.module.scss`

Os tokens do projeto (`src/styles/_tokens.scss`) são **CSS custom properties globais** (`--vtex-pink`, `--color-muted-*`, `--space-*`, `--radius-*`, `--shadow-card`), já disponíveis em qualquer seletor porque são declaradas em `:root` e importadas uma única vez em `_main.scss`. Isso significa que **não é preciso `@use`/`@import` nada** para consumi-los — basta `var(--token)`:

```scss
.qtySelector {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  border: 1px solid var(--color-muted-2);
  border-radius: var(--radius-button);
  background-color: var(--color-muted-0);

  &__btn {
    color: var(--color-muted-4);

    &:hover:not(:disabled) {
      color: var(--color-muted-5);
    }
  }
}
```

Regras de qualidade:
- Classe raiz com o nome do componente em camelCase
- **Nunca** hardcodar cor, espaçamento, raio de borda ou fonte — sempre usar os tokens de `_tokens.scss`. Se um valor necessário não existir ainda, **adicione-o em `_tokens.scss`** seguindo a convenção existente, em vez de hardcodar
- Se o componente precisar de um valor Sass "de verdade" (não CSS custom property) — por exemplo, uma função `map-get` ou um mixin de breakpoint reutilizável — e isso ainda não existir no projeto, crie um `src/styles/_mixins.scss` novo e importe com `@use '../../styles/mixins' as *;` (ajustando o caminho relativo à profundidade). Hoje o projeto **não tem** esse arquivo — não invente mixins que não existem só para seguir um padrão de outro stack

### 5. Registrar o componente

- **Atoms/molecules**: não precisam de registro — são importados diretamente onde forem usados (`import QtySelector from '~scripts/components/QtySelector/QtySelector'` ou caminho relativo).
- **Features**: precisam de um ponto de montagem no DOM real do checkout. Siga o padrão de `renderCartComponent.tsx`:
  1. Crie `src/scripts/render<Feature>Component.tsx`, responsável por localizar o container certo no checkout (por hash de rota, classe do template, etc.), esconder o conteúdo nativo equivalente e montar o componente React via `ReactDOM.render`.
  2. Importe esse `render<Feature>Component.tsx` em `src/checkout6-custom.tsx` (o entrypoint do bundle) — **se não for importado ali, a feature nunca roda no checkout real**, mesmo compilando sem erro. Esse é o equivalente, neste projeto, ao erro silencioso de "default export ausente" do FastStore: aqui o risco é esquecer o import no entrypoint.
  3. Se a feature precisa reagir a mudanças de step/hash ou a eventos do `orderForm`, registre os listeners (`hashchange`, `orderFormUpdated.vtex`) dentro do próprio `render<Feature>Component.tsx`, do mesmo jeito que `renderCartComponent.tsx` já faz.

### 6. Não há passo de CMS/schema

Este projeto não tem Site Editor, CMS nem `sections.json` (ver [CLAUDE.md](../../CLAUDE.md)). Não crie arquivos `schema.json`/`cms_component__*.jsonc` nem rode qualquer "cms-sync" — isso não existe aqui. Se o lojista precisar configurar algo dinamicamente, a única via hoje é código (constantes/props no próprio componente); qualquer mecanismo de configuração via admin exigiria migrar essa feature para um app de Store Framework separado, o que é uma decisão arquitetural maior e fora do escopo desta skill.

---

## Checklist final antes de entregar

- [ ] `<NomeDoComponente>.types.ts` com interface exportada
- [ ] `<NomeDoComponente>.tsx` usando CSS Module e tipagem correta — **só apresentação**, sem `React.FC`
- [ ] Lógica não-trivial extraída para `use<NomeDoComponente>.ts` (estado/efeitos/handlers/`vtexjs` fora do `.tsx`)
- [ ] Nenhum `<svg>` inline de UI — ícones em `src/scripts/components/Icons/` com barrel `index.ts`
- [ ] `<NomeDoComponente>.module.scss` com classe raiz, consumindo tokens via `var(--token)` — sem `@use` a menos que exista mixin Sass real
- [ ] Nenhuma div/wrapper estrutural ficou sem `className` sem que isso tenha sido checado contra o CSS/componente de origem (propriedades diretas no seletor raiz, não só regras aninhadas); nenhum `Fragment` substituindo um elemento com estilo próprio fora do caso de layout flex/grid
- [ ] Se **feature**: `render<Feature>Component.tsx` criado e **importado em `checkout6-custom.tsx`**
- [ ] Se **feature** conectada ao carrinho: trata `isMock`/ausência de `window.vtexjs`
- [ ] Sem `any` fora do escape hatch isolado de `window.vtexjs`, sem valores hardcoded de design, sem comentários desnecessários
- [ ] Nenhum `schema.json`/CMS criado — este projeto não tem Site Editor
- [ ] Validado com `yarn build` (não só o type-check do editor)

---

## Diferenças em relação ao template original (FastStore)

Esta skill foi adaptada de um template FastStore/Store Framework. O que foi removido ou trocado, e por quê:

| FastStore | checkout-ui-custom | Motivo |
|---|---|---|
| CSS Handles (`vtex.css-handles`) | CSS Modules puro (`*.module.scss`) | Não é app de Store Framework, não passa pelo builder da VTEX IO |
| `organism` registrado em `src/components/index.tsx` com `export default` (mapa de sections) | `feature` montada via `render<Feature>Component.tsx`, importado em `checkout6-custom.tsx` | Não há resolução de sections pelo core; a montagem é manual via `ReactDOM.render` |
| Props de organism espelham `sections.json` (CMS) | Props/estado de feature vêm de hook/context próprio (`useCart`, etc.) | Não existe CMS/Site Editor customizando este bundle |
| `cms/faststore/components/cms_component__*.jsonc` + `yarn cms-sync` | Não existe — nenhum passo equivalente | Sem Site Editor, sem schema |
| `@use '../../styles/globals' as *` + variáveis/mixins Sass (`$color-*`, `font()`, `gradient-linear()`) | `var(--token)` direto, sem import — tokens são CSS custom properties globais | O projeto não tem uma camada de variáveis/mixins Sass; os tokens já são globais via `:root` |
| Nunca usar tokens `--fs-*` nativos | Sempre usar os tokens já existentes em `_tokens.scss` (`--vtex-*`, `--color-*`, `--space-*`, `--radius-*`) | Mesmo princípio (não hardcodar), tokens diferentes |

## Ao terminar

Mostre ao usuário:
1. Os arquivos criados com seus caminhos
2. Se for uma **feature**, confirme explicitamente que o `render<Feature>Component.tsx` foi importado em `checkout6-custom.tsx` — esse é o erro mais fácil de esquecer e o componente simplesmente não aparece no checkout
3. Se o componente compõe atoms/molecules existentes, sugerir quais reutilizar

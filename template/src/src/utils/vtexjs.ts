/**
 * Único ponto de acesso ao global `window.vtexjs` — todo hook/contexto deve
 * ler o vtexjs por aqui em vez de fazer `(window as any).vtexjs` direto, para
 * manter a checagem de existência (CLAUDE.md: "Nunca acesse window.vtexjs sem
 * guarda") num único lugar.
 *
 * @returns O global `vtexjs`, ou `null` se ainda não tiver carregado (SSR,
 * primeiro paint antes do script nativo, ambiente de teste).
 */
export function getVtexjs(): any | null {
  return typeof window !== 'undefined' && (window as any).vtexjs
    ? (window as any).vtexjs
    : null
}

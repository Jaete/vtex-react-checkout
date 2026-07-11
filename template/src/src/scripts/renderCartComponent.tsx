import { createRoot, type Root } from 'react-dom/client'
import Cart from '~components/Cart/Cart'

const CUSTOM_CONTAINER_CLASS = 'econverse-cart-container'

// React 18: o root é criado uma única vez por container e reaproveitado.
// Chamar createRoot de novo no mesmo nó emite warning; atualizações vão via
// root.render (que reconcilia) e, na prática, pelo próprio estado dos hooks.
// Guardamos também o container que o root aponta: se o SmartCheckout
// re-renderizar `.cart-template` (Handlebars) e substituir esse nó, o
// container antigo fica desconectado do DOM — precisamos detectar isso e
// recriar o root no novo container, senão `cartRoot.render` escreve num nó
// órfão e o carrinho visível nunca atualiza.
let cartRoot: Root | null = null
let cartRootContainer: Element | null = null

const renderCart = () => {
  const hash = window.location.hash
  // In VTEX checkout, the cart page usually has hash '#/cart', empty, or '#/'
  const isCartPage = hash === '' || hash === '#/cart' || hash === '#/'

  const cartTemplate = document.querySelector('.cart-template')
  if (!cartTemplate) return

  if (isCartPage) {
    // Hide native VTEX cart content inside the template
    Array.from(cartTemplate.children).forEach((child: any) => {
      if (!child.classList.contains(CUSTOM_CONTAINER_CLASS)) {
        child.style.display = 'none'
      }
    })

    // Create or locate our custom container
    let container = document.querySelector(`.${CUSTOM_CONTAINER_CLASS}`)
    if (!container) {
      container = document.createElement('div')
      container.className = CUSTOM_CONTAINER_CLASS
      cartTemplate.prepend(container)
    }

    ;(container as HTMLElement).style.display = 'block'

    // Render the React Cart — cria o root na primeira vez, e de novo sempre
    // que o container encontrado/criado não for mais o que o root aponta
    // (ex.: VTEX substituiu `.cart-template` e nosso container antigo ficou
    // desconectado do DOM).
    if (
      !cartRoot ||
      cartRootContainer !== container ||
      !container.isConnected
    ) {
      cartRoot?.unmount()
      cartRoot = createRoot(container)
      cartRootContainer = container
    }
    cartRoot.render(<Cart />)
  } else {
    // If we've navigated away from the cart, hide our custom component
    const container = document.querySelector(
      `.${CUSTOM_CONTAINER_CLASS}`
    ) as HTMLElement
    if (container) {
      container.style.display = 'none'
    }

    // Restore visibility of native VTEX checkout content for other steps
    Array.from(cartTemplate.children).forEach((child: any) => {
      if (!child.classList.contains(CUSTOM_CONTAINER_CLASS)) {
        child.style.display = ''
      }
    })
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  renderCart()
  window.addEventListener('hashchange', renderCart)

  // Listen to VTEX orderForm updates to ensure state sync is immediate
  if (typeof window !== 'undefined') {
    const $ = (window as any).$
    if ($) {
      $(window).on('orderFormUpdated.vtex', () => {
        renderCart()
      })
    }
  }
})

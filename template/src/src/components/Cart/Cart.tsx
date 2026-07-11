import Header from './components/Header/Header'
import CartContent from './components/CartContent/CartContent'
import { CartProvider } from './context/CartContext'
import styles from './Cart.module.scss'

// "vtex-cart-app" é uma classe literal (não hasheada) de propósito: é nela
// que o InjectGlobalResetPlugin (webpack.config.js) ancora o reset universal
// injetado direto no CSS final. styles.app cobre o restante (fundo, padding,
// tipografia) sem esse problema de ordem — ver Cart.module.scss.
interface CartProps {
  /** Pré-seleciona a 1ª opção de frete após o cálculo (padrão `true`). */
  autoSelectShipping?: boolean
}

function Cart({ autoSelectShipping }: CartProps) {
  return (
    <CartProvider autoSelectShipping={autoSelectShipping}>
      <div className={`vtex-cart-app ${styles.app}`}>
        <Header />
        <main>
          <CartContent />
        </main>
      </div>
    </CartProvider>
  )
}

export default Cart

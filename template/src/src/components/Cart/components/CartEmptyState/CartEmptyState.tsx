import { EmptyCartIcon } from '~components/Icons'
import styles from './CartEmptyState.module.scss'

function CartEmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>
        <EmptyCartIcon width={64} height={64} />
      </div>
      <h2 className={styles.title}>Seu carrinho está vazio</h2>
      <p className={styles.subtitle}>
        Navegue pela loja e adicione produtos para continuar.
      </p>
      <a href="/" className={styles.cta}>
        Voltar para a página inicial
      </a>
    </div>
  )
}

export default CartEmptyState

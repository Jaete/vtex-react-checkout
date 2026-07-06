import { TrashIcon } from '../../../Icons';
import QtySelector from '../../../QtySelector/QtySelector';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../../../../utils/currency';
import styles from './CartItemsList.module.scss';

function CartItemsList() {
  const { orderForm, loading, updateItemQuantity, removeItem } = useCart();
  const items = orderForm?.items || [];

  if (loading && items.length === 0) {
    return (
      <div className={styles.skeleton}>
        {[1, 2].map((i) => (
          <div key={i} className={styles.skeletonRow}>
            <div className={styles.skeletonImg} />
            <div className={styles.skeletonDetails}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonMeta} />
            </div>
            <div className={styles.skeletonRight}>
              <div className={styles.skeletonPrice} />
              <div className={styles.skeletonQty} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {items.map((item, index) => {
        const hasDiscount = item.listPrice > item.price;

        return (
          <div key={`${item.id}-${index}`} className={styles.item}>
            <div className={styles.imageContainer}>
              <img
                src={item.imageUrl || 'https://placehold.co/100x100?text=Produto'}
                alt={item.name}
                className={styles.image}
              />
            </div>

            <div className={styles.details}>
              <div className={styles.top}>
                <div className={styles.titleBlock}>
                  <a href={item.detailUrl || '#'} className={styles.name}>
                    {item.name}
                  </a>
                  <div className={styles.sku}>Ref: {item.id}</div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={loading}
                  className={styles.remove}
                  aria-label="Remover produto"
                >
                  <TrashIcon width={18} height={18} />
                </button>
              </div>

              <div className={styles.bottom}>
                <div className={styles.prices}>
                  {hasDiscount && <span className={styles.priceList}>{formatCurrency(item.listPrice)}</span>}
                  <span className={styles.priceSelling}>{formatCurrency(item.price)}</span>
                </div>

                <QtySelector
                  value={item.quantity}
                  onDecrease={() => updateItemQuantity(index, item.quantity - 1)}
                  onIncrease={() => updateItemQuantity(index, item.quantity + 1)}
                  decreaseDisabled={item.quantity <= 1 || loading}
                  increaseDisabled={loading}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default CartItemsList;

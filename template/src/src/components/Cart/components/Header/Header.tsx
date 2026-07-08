import { Fragment } from 'react';

import { LogoIcon, SecurityIcon } from '~components/Icons';
import styles from './Header.module.scss';

const STEPS = [
  { number: 1, label: 'Carrinho', active: true },
  { number: 2, label: 'Dados', active: false },
  { number: 3, label: 'Entrega', active: false },
  { number: 4, label: 'Pagamento', active: false },
];

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <LogoIcon />
        </div>

        <div className={styles.stepper}>
          {STEPS.map((step, index) => (
            <Fragment key={step.number}>
              <div className={`${styles.step} ${step.active ? styles.stepActive : ''}`}>
                <span className={styles.num}>{step.number}</span>
                <span>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && <div className={styles.divider} />}
            </Fragment>
          ))}
        </div>

        <div className={styles.security}>
          <SecurityIcon width={16} height={16} className={styles.securityIcon} />
          <span>Compra 100% segura</span>
        </div>
      </div>
    </header>
  );
}

export default Header;

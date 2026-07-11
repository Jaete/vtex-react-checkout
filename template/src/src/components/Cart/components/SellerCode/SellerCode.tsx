import Button from '~components/Button/Button'
import FieldError from '~components/FieldError/FieldError'
import SectionTitle from '~components/SectionTitle/SectionTitle'
import TextInput from '~components/TextInput/TextInput'
import type { SellerCodeProps } from './SellerCode.types'
import { useSellerCode } from './useSellerCode'
import styles from './SellerCode.module.scss'

function SellerCode({ setOpenTextField = false }: SellerCodeProps) {
  const {
    code,
    setCode,
    activeCode,
    sellerCodeError,
    loading,
    showInput,
    handleSubmit,
    handleAlter,
  } = useSellerCode({
    setOpenTextField,
  })

  return (
    <div className={styles.sellerCode}>
      <SectionTitle>Código do Vendedor</SectionTitle>

      {showInput ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              variant="primary"
            >
              Aplicar
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.applied}>
          <span className={styles.code}>{activeCode}</span>
          <Button size="sm" onClick={handleAlter} disabled={loading}>
            Alterar
          </Button>
        </div>
      )}

      {sellerCodeError && <FieldError>{sellerCodeError}</FieldError>}
    </div>
  )
}

export default SellerCode

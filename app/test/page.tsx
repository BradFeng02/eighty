import Space from '../components/Space/Space'
import styles from './test.module.css'

const testpage = () => {
  return (
    <>
      <main
        className={`${styles['test-container']} border-8 border-solid border-black`}
      >
        <Space></Space>
      </main>
    </>
  )
}

export default testpage

import Space from '../components/Space/Space'
import styles from './test.module.css'

const testpage = () => {
  return (
    <>
      <main
        className={`${styles['test-container']} resize overflow-auto border-8 border-solid border-black p-2`}
      >
        <Space></Space>
      </main>
    </>
  )
}

export default testpage

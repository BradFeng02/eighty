import Space from '../components/Space/Space'
import styles from './test.module.css'

const testpage = () => {
  return (
    <>
      <main
        style={{
          position: 'absolute',
          top: '100px',
          left: '100px',
        }}
        className={`${styles['test-container']} resize overflow-auto border-8 border-solid border-black`}
      >
        <Space></Space>
      </main>
    </>
  )
}

export default testpage

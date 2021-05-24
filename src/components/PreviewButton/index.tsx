import Link from 'next/link';
import styles from './preview.module.scss';

export default function PreviewButton() {
  return(
    <aside className={styles.button}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  )
}

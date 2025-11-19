// src/components/StoreCard.tsx

import React from 'react'
import styles from './StoreCard.module.css'

type StoreCardProps = {
  id?: string | number
  name: string
  description?: string
  image?: string // path under /public or external url
  onClick?: () => void
  className?: string
}

const StoreCard: React.FC<StoreCardProps> = ({ name, description, image, onClick, className }) => {
  return (
    <div className={[styles.card, className || ''].join(' ')} onClick={onClick} role="button" tabIndex={0}>
      {image ? (
        // If you use next/image, replace <img /> with Image component import
        <div className={styles.media}>
          <img src={image} alt={name} className={styles.image} />
        </div>
      ) : null}
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        {description ? <p className={styles.desc}>{description}</p> : null}
      </div>
    </div>
  )
}

export default StoreCard
'use client'
import React from 'react'
import styles from './StoreCard.module.css'

type StoreCardProps = {
  name: string
  description?: string
  image?: string
  onClick?: () => void
}

export default function StoreCard({ name, description, image, onClick }: StoreCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div className={styles.card} onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
      {image ? (
        <div className={styles.media}>
          <img src={image} alt={name} className={styles.image} loading="lazy" />
        </div>
      ) : (
        <div className={styles.media} />
      )}
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        {description ? <p className={styles.desc}>{description}</p> : null}
      </div>
    </div>
  )
}

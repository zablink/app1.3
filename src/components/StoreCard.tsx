'use client'
import React from 'react'
import styles from './StoreCard.module.css'

type StoreCardProps = {
  id?: string | number
  name: string
  description?: string
  image?: string
  onClick?: () => void
}

export default function StoreCard({ name, description, image, onClick }: StoreCardProps) {
  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      {image ? (
        <div className={styles.media}>
          <img src={image} alt={name} className={styles.image} />
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

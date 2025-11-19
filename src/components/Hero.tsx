'use client'
import React from 'react'
import styles from './Hero.module.css'

type HeroProps = {
  title?: string
  subtitle?: string
  backgroundImage?: string
  ctaLabel?: string
  ctaLink?: string
}

export default function Hero({ title = 'ยินดีต้อนรับสู่ Zablink', subtitle = '', backgroundImage = '/hero.jpg', ctaLabel = 'เริ่มต้น', ctaLink }: HeroProps) {
  return (
    <section className={styles.hero} style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          {ctaLink ? (
            <a href={ctaLink} className={styles.cta}>
              {ctaLabel}
            </a>
          ) : (
            <button className={styles.cta}>{ctaLabel}</button>
          )}
        </div>
      </div>
    </section>
  )
}

// src/components/Hero.tsx

import React from 'react'
import styles from './Hero.module.css'

type HeroProps = {
  title?: string
  subtitle?: string
  ctaLabel?: string
  onCtaClick?: () => void
  backgroundImage?: string // path under /public, e.g. '/hero.jpg'
}

const Hero: React.FC<HeroProps> = ({
  title = 'ยินดีต้อนรับสู่ Zablink',
  subtitle = 'ค้นหาร้านค้าที่คุณชอบได้ที่นี่',
  ctaLabel = 'เริ่มต้น',
  onCtaClick,
  backgroundImage = '/hero.jpg',
}) => {
  const bgStyle: React.CSSProperties = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : {}

  return (
    <section className={styles.hero} style={bgStyle}>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          <button className={styles.cta} onClick={onCtaClick}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero
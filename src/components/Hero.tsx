// src/components/Hero.tsx

import React from 'react'
import Link from 'next/link'
import styles from './Hero.module.css'

type HeroProps = {
  title?: string
  subtitle?: string
  ctaLabel?: string
  onCtaClick?: () => void
  backgroundImage?: string
  enableOverlay?: boolean
  link?: string // Direct link when clicking banner
}

const Hero: React.FC<HeroProps> = ({
  title = 'ยินดีต้อนรับสู่ Zablink',
  subtitle = 'ค้นหาร้านค้าที่คุณชอบได้ที่นี่',
  ctaLabel = 'เริ่มต้น',
  onCtaClick,
  backgroundImage = '/hero.jpg',
  enableOverlay = true,
  link,
}) => {
  const bgStyle: React.CSSProperties = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : {}

  const content = (
    <section className={styles.hero} style={bgStyle}>
      {enableOverlay ? (
        <div className={styles.overlay}>
          <div className={styles.content}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
            {ctaLabel && (
              <button className={styles.cta} onClick={onCtaClick}>
                {ctaLabel}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.noOverlay} />
      )}
    </section>
  )

  // If link is provided, wrap in Link component
  if (link) {
    return (
      <Link href={link} className={styles.heroLink}>
        {content}
      </Link>
    )
  }

  return content
}

export default Hero
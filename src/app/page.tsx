import React from 'react'
import Hero from '../components/Hero'
import StoreCard from '../components/StoreCard'

type HeroAd = {
  id: string
  title?: string
  subtitle?: string
  image?: string
  ctaLabel?: string
  ctaLink?: string
}

async function fetchHeroAd(): Promise<HeroAd | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    const res = await fetch(`${base}/api/ads/hero`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data) return null
    return data as HeroAd
  } catch (err) {
    console.warn('fetchHeroAd error', err)
    return null
  }
}

const dummyStores = [
  { id: 1, name: 'ร้าน A', description: 'ร้านอาหารอร่อย', image: '/stores/store1.jpg' },
  { id: 2, name: 'ร้าน B', description: 'ของหวานสุดชิค', image: '/stores/store2.jpg' },
  { id: 3, name: 'ร้าน C', description: 'เครื่องดื่มเย็นใจ', image: '/stores/store3.jpg' },
]

export default async function Page() {
  const heroAd = await fetchHeroAd()
  const heroProps = heroAd
    ? {
        title: heroAd.title || 'โปรโมชั่นพิเศษ',
        subtitle: heroAd.subtitle || '',
        backgroundImage: heroAd.image || '/hero.jpg',
        ctaLabel: heroAd.ctaLabel || 'ดูรายละเอียด',
        ctaLink: heroAd.ctaLink || undefined,
      }
    : {
        title: 'ยินดีต้อนรับสู่ Zablink',
        subtitle: 'ค้นหาร้านค้าที่คุณชอบได้ที่นี่',
        backgroundImage: '/hero.jpg',
        ctaLabel: 'เริ่มต้น',
      }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Hero
        title={heroProps.title}
        subtitle={heroProps.subtitle}
        backgroundImage={heroProps.backgroundImage}
        ctaLabel={heroProps.ctaLabel}
        ctaLink={heroProps.ctaLink}
      />

      <section style={{ marginTop: 28 }}>
        <h2>ร้านแนะนำ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginTop: 12 }}>
          {dummyStores.map((s) => (
            <StoreCard key={s.id} name={s.name} description={s.description} image={s.image} />
          ))}
        </div>
      </section>
    </main>
  )
}
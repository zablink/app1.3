
import Link from 'next/link';

interface AdBannerProps {
  placement: 'A' | 'B' | 'C';
  ad: {
    imageUrl: string;
    linkUrl: string;
    title: string;
  };
}

const placementStyles = {
  A: {
    container: 'w-full h-[250px] bg-gray-200',
    image: 'w-full h-full object-cover',
  },
  B: {
    container: 'w-full h-[250px] bg-gray-200',
    image: 'w-full h-full object-cover',
  },
  C: {
    container: 'w-full h-[90px] bg-gray-200',
    image: 'w-full h-full object-cover',
  },
};

export default function AdBanner({ placement, ad }: AdBannerProps) {
  const styles = placementStyles[placement];

  // In a real scenario, we would also have an impression tracking call here

  return (
    <div className={styles.container}>
      <Link href={ad.linkUrl} target="_blank" rel="noopener noreferrer" title={ad.title}>
        <img src={ad.imageUrl} alt={ad.title} className={styles.image} />
      </Link>
    </div>
  );
}

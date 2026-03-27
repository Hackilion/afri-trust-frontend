import { IlluminatedHero } from '@/components/ui/illuminated-hero';

/** Optional full-screen demo of the primitive; not routed by default. */
export default function IlluminatedHeroDemo() {
  return (
    <IlluminatedHero
      headlinePrefix="Introducing"
      highlightText="Illuminated Glow Text."
      headlineSuffix="Highlight the main focus text."
      description={
        <>
          Experience a new way to draw attention to key elements with stunning{' '}
          <span className="font-black text-[#e7dfd6]">illuminated text.</span>
        </>
      }
    />
  );
}

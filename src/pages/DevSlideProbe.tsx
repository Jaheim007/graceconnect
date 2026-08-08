/** TEMP dev probe: renders a flashcard + text slide with a lesson illustration. */
import { SlideRenderer } from '@/components/programs/lesson-preview/SlideRenderer';
import { DEFAULT_CUSTOMIZATION } from '@/components/programs/lesson-preview/SlideCustomizationPanel';

const IMG = 'https://xzgpzbrgsxtcsktiprik.supabase.co/storage/v1/object/public/org-uploads/1eaaa89d-cc5c-4f68-a62f-a57c3499a332/4821159b-1d5e-46b8-8252-06fc5fd199d7/lessons/lesson-0-1786178737463.jpg';

export default function DevSlideProbe() {
  return (
    <div className="h-screen grid grid-rows-2">
      <SlideRenderer
        slide={{ type: 'flashcard', flashcard: { front: 'Front?', back: 'Back' } } as any}
        slideIndex={0} totalSlides={2} lessonTitle="L1" moduleTitle="M"
        lessonImageUrl={IMG}
        customization={{ ...DEFAULT_CUSTOMIZATION, bgImageUrl: IMG }}
        deviceMode="desktop"
      />
      <SlideRenderer
        slide={{ type: 'content', heading: 'Heading', bodyHtml: '<p>Body text</p>' } as any}
        slideIndex={1} totalSlides={2} lessonTitle="L1" moduleTitle="M"
        lessonImageUrl={IMG}
        customization={{ ...DEFAULT_CUSTOMIZATION, bgImageUrl: IMG }}
        deviceMode="desktop"
      />
    </div>
  );
}

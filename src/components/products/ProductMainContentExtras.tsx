import { memo } from 'react';
import {
  FileText, BookOpen, Music, Link2, Shield, HelpCircle,
  MessageSquareQuote, PackagePlus, Star, ShoppingBag,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProductReviews } from '@/components/products/ProductReviews';
import { ViralSnippets } from '@/components/products/ViralSnippets';
import { ExperimentDescription } from '@/components/products/ExperimentDescription';
import { formatPrice } from '@/lib/currency';

interface ProductMainContentExtrasProps {
  product: any;
  slug: string;
  isPurchased: boolean;
  canManage: boolean;
  locale: string;
  t: (key: string) => string;
}

export const ProductMainContentExtras = memo(function ProductMainContentExtras({
  product,
  slug,
  isPurchased,
  canManage,
  locale,
  t,
}: ProductMainContentExtrasProps) {
  const faqItems: { q: string; a: string }[] = product.faq_json || [];
  const testimonials: { name: string; text: string }[] = product.testimonials_json || [];
  const guaranteeText: string | null = product.guarantee_text;
  const bundleItems = product._bundleItems || [];

  return (
    <>
      {/* Description */}
      {product.description && (
        <div className="space-y-4 overflow-hidden">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-primary" />
            {t('product.description')}
          </h2>
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
            <ExperimentDescription
              defaultDescription={product.description}
              className="text-sm text-muted-foreground leading-relaxed break-words prose prose-sm max-w-none"
            />
          </div>
        </div>
      )}

      {/* Bundle Items */}
      {product.is_bundle && bundleItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-primary" /> Ce bundle inclut
          </h2>
          <div className="space-y-2">
            {bundleItems.map((bi: any) => (
              <div key={bi.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                {bi.included_product?.cover_image_url ? (
                  <img src={bi.included_product.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{bi.included_product?.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{bi.included_product?.product_type}</p>
                </div>
                {bi.included_product?.price > 0 && !bi.included_product?.is_free && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(bi.included_product.price, false, bi.included_product.currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guarantee */}
      {guaranteeText && (
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Garantie</p>
              <p className="text-sm text-muted-foreground mt-1">{guaranteeText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4" /> Témoignages
          </h2>
          <div className="space-y-2">
            {testimonials.map((t, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm italic text-muted-foreground">"{t.text}"</p>
                <p className="text-xs font-semibold mt-2">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Questions fréquentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Reviews */}
      <div id="reviews">
        <ProductReviews
          productId={product.id}
          organizationId={product.organization_id}
          isPurchased={isPurchased}
          isOrgOwner={!!canManage}
        />
      </div>

      {/* Viral Snippets */}
      <ViralSnippets
        productId={product.id}
        productTitle={product.title}
        orgSlug={slug || ''}
      />
    </>
  );
});

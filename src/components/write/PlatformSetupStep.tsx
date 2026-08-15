import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Church, GraduationCap, Loader2, Rocket, Store, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { useI18n } from '@/i18n/I18nContext';
import type { SiteviralWorld } from '@/lib/siteviral/worlds';

export interface PlatformSetupValues {
  name: string;
  currency: string;
  world: SiteviralWorld;
}

interface Props {
  defaultName?: string;
  defaultCurrency?: string;
  defaultWorld?: SiteviralWorld;
  submitting?: boolean;
  onConfirm: (values: PlatformSetupValues) => void;
  onBack?: () => void;
  /** Label of the primary button (e.g. "Create and publish"). */
  ctaLabel?: string;
  title?: string;
  subtitle?: string;
}

const WORLD_OPTIONS: { id: SiteviralWorld; icon: typeof Store; fr: string; en: string; frDesc: string; enDesc: string }[] = [
  { id: 'digital', icon: BookOpen, fr: 'Livres & contenus numériques', en: 'Books & digital content', frDesc: 'Ebooks, guides, PDF, audio', enDesc: 'Ebooks, guides, PDFs, audio' },
  { id: 'education', icon: GraduationCap, fr: 'Formations & cours', en: 'Courses & training', frDesc: 'Modules, leçons, quiz, certificats', enDesc: 'Modules, lessons, quizzes, certificates' },
  { id: 'church', icon: Church, fr: 'Église / ONG', en: 'Church / NGO', frDesc: 'Enseignements, dons, offrandes', enDesc: 'Teachings, giving, donations' },
  { id: 'events', icon: Store, fr: 'Événements & billets', en: 'Events & tickets', frDesc: 'Packages, billets, réservations', enDesc: 'Packages, tickets, bookings' },
];

/**
 * Full-page platform setup — asked once, near the end of the creation flow:
 * what you sell, the platform name, and the selling currency.
 * Replaces the old modal so it reads as a real step, not a popup.
 */
export function PlatformSetupStep({
  defaultName = '',
  defaultCurrency = 'XOF',
  defaultWorld = 'digital',
  submitting,
  onConfirm,
  onBack,
  ctaLabel,
  title,
  subtitle,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [world, setWorld] = useState<SiteviralWorld>(defaultWorld);
  const [name, setName] = useState(defaultName);
  const [currency, setCurrency] = useState(defaultCurrency);

  const trimmed = name.trim();
  const valid = trimmed.length >= 2 && !!currency && !!world;

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
          {isFr ? 'Dernière étape' : 'Last step'}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          {title || (isFr ? 'Crée ta plateforme' : 'Create your platform')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {subtitle || (isFr
            ? "C'est la boutique qui accueillera ce que tu vends. Tu pourras tout modifier plus tard."
            : 'This is the store that will host what you sell. You can change everything later.')}
        </p>
      </div>

      {/* 1. What do you sell */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">
          {isFr ? '1. Que vends-tu ?' : '1. What do you sell?'}
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          {WORLD_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = world === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setWorld(opt.id)}
                className={`relative text-left rounded-2xl border p-4 transition-all ${
                  active
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 bg-card'
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </span>
                )}
                <Icon className={`h-5 w-5 mb-2 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-semibold leading-tight">{isFr ? opt.fr : opt.en}</p>
                <p className="text-xs text-muted-foreground mt-1">{isFr ? opt.frDesc : opt.enDesc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Name */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">
          {isFr ? '2. Nom de ta plateforme' : '2. Your platform name'}
        </label>
        <Input
          value={name}
          maxLength={60}
          placeholder={isFr ? 'Ex : Éditions Grâce' : 'e.g. Grace Editions'}
          onChange={(e) => setName(e.target.value)}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {isFr ? "C'est le nom que tes acheteurs verront." : 'This is the name your buyers will see.'}
        </p>
      </div>

      {/* 3. Currency */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">
          {isFr ? '3. Devise de vente' : '3. Selling currency'}
        </label>
        <CurrencySelector value={currency} onChange={(c) => setCurrency(c)} className="h-12" />
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        {onBack && (
          <Button variant="ghost" size="lg" onClick={onBack} disabled={submitting} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isFr ? 'Retour' : 'Back'}
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1 gap-2"
          disabled={!valid || submitting}
          onClick={() => onConfirm({ name: trimmed, currency, world })}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          {ctaLabel || (isFr ? 'Créer ma plateforme' : 'Create my platform')}
        </Button>
      </div>
    </div>
  );
}

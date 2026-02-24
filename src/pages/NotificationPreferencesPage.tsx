import { ArrowLeft, Bell, Mail, ShoppingBag, Heart, Megaphone, Calendar, MessageSquare, Users, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useNotificationPreferences, useUpdateNotificationPreferences, type NotifPrefs } from '@/hooks/useNotificationPreferences';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

const PREFS: Array<{ key: keyof NotifPrefs; icon: typeof Bell; labelFr: string; labelEn: string; descFr: string; descEn: string }> = [
  { key: 'email_enabled', icon: Mail, labelFr: 'Notifications email', labelEn: 'Email notifications', descFr: 'Recevoir par email', descEn: 'Receive by email' },
  { key: 'push_enabled', icon: Bell, labelFr: 'Notifications push', labelEn: 'Push notifications', descFr: 'Alertes dans le navigateur', descEn: 'Browser alerts' },
  { key: 'purchases', icon: ShoppingBag, labelFr: 'Achats', labelEn: 'Purchases', descFr: 'Confirmations d\'achat', descEn: 'Purchase confirmations' },
  { key: 'donations', icon: Heart, labelFr: 'Dons', labelEn: 'Donations', descFr: 'Notifications de dons', descEn: 'Donation notifications' },
  { key: 'announcements', icon: Megaphone, labelFr: 'Annonces', labelEn: 'Announcements', descFr: 'Nouvelles annonces', descEn: 'New announcements' },
  { key: 'events', icon: Calendar, labelFr: 'Événements', labelEn: 'Events', descFr: 'Rappels d\'événements', descEn: 'Event reminders' },
  { key: 'comments', icon: MessageSquare, labelFr: 'Commentaires', labelEn: 'Comments', descFr: 'Réponses à vos commentaires', descEn: 'Replies to your comments' },
  { key: 'affiliate', icon: Users, labelFr: 'Affiliation', labelEn: 'Affiliate', descFr: 'Commissions et ventes', descEn: 'Commissions and sales' },
  { key: 'programs', icon: BookOpen, labelFr: 'Programmes', labelEn: 'Programs', descFr: 'Progression et certificats', descEn: 'Progress and certificates' },
  { key: 'marketing', icon: Sparkles, labelFr: 'Marketing', labelEn: 'Marketing', descFr: 'Promotions et nouveautés', descEn: 'Promotions and news' },
];

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: prefs } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const handleToggle = (key: keyof NotifPrefs) => {
    if (!prefs) return;
    update.mutate({ [key]: !prefs[key] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={isFr ? 'Préférences de notifications' : 'Notification Preferences'} />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm flex-1">{isFr ? 'Préférences' : 'Preferences'}</span>
      </div>
      <main id="main-content" className="container max-w-lg py-5 space-y-2">
        {PREFS.map((p) => (
          <div key={p.key} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <p.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{isFr ? p.labelFr : p.labelEn}</p>
              <p className="text-[10px] text-muted-foreground">{isFr ? p.descFr : p.descEn}</p>
            </div>
            <Switch
              checked={prefs?.[p.key] ?? true}
              onCheckedChange={() => handleToggle(p.key)}
              aria-label={isFr ? p.labelFr : p.labelEn}
            />
          </div>
        ))}
      </main>
    </div>
  );
}

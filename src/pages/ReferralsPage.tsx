import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useReferrals } from "@/hooks/useReferrals";
import { useI18n } from "@/i18n/I18nContext";
import {
  Copy, Check, Gift, Users, Sparkles, Share2, ArrowLeft, Trophy,
  Mail, MessageCircle, Twitter, Facebook, Linkedin, Send,
} from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/seo/SEOHead";
import { LandingNav } from "@/components/landing/LandingNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReferralsPage() {
  const navigate = useNavigate();
  const { stats, loading } = useReferrals();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const link = stats?.code ? `https://siteviral.com/?ref=${stats.code}` : "";

  const copy = async (value: string, which: "link" | "code") => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    if (which === "link") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    toast.success(isFr ? "Copié !" : "Copied!");
  };

  const shareText = isFr
    ? "Rejoins-moi sur SiteViral pour vendre tes contenus en ligne !"
    : "Join me on SiteViral to sell your content online!";

  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      try { await navigator.share({ title: "SiteViral", text: shareText, url: link }); } catch {}
    } else {
      copy(link, "link");
    }
  };

  const shareLinks = link ? {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + link)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    email: `mailto:?subject=${encodeURIComponent("SiteViral")}&body=${encodeURIComponent(shareText + "\n\n" + link)}`,
  } : null;

  const progress = stats ? ((stats.active % 3) / 3) * 100 : 0;
  const activeCount = stats?.active ?? 0;
  const totalRewards = stats?.rewards.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? "Programme de parrainage — SiteViral" : "Referral program — SiteViral"}
        description={isFr ? "Invitez vos amis et gagnez des mois Pro gratuits." : "Invite friends and earn free Pro months."}
        canonicalUrl="https://siteviral.com/referrals"
      />
      <LandingNav />

      <main className="container max-w-4xl px-4 pt-24 pb-24">
        <Button variant="ghost" onClick={() => navigate('/billing')} className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {isFr ? "Retour à l'abonnement" : "Back to subscription"}
        </Button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-amber-500/10 p-8 mb-8">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-3 w-3" />
              {isFr ? "Cadeau illimité" : "Unlimited gift"}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Gift className="h-8 w-8 text-primary" />
              {isFr ? "Programme de parrainage" : "Referral program"}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              {isFr
                ? "Invite 3 créateurs actifs et reçois 1 mois Pro offert. Cumulable à l'infini — chaque ami compte."
                : "Invite 3 active creators and get 1 free Pro month. Stack rewards forever — every friend counts."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Invite link card */}
            <Card className="mb-6 border-primary/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{isFr ? "Ton lien d'invitation" : "Your invite link"}</CardTitle>
                <CardDescription>
                  {isFr ? "Partage-le partout — il te suit à vie." : "Share it anywhere — it's yours for life."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={link} readOnly className="font-mono text-sm bg-muted/50" />
                  <div className="flex gap-2">
                    <Button onClick={() => copy(link, "link")} variant="outline" size="icon" className="shrink-0">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button onClick={share} className="gap-1.5">
                      <Share2 className="h-4 w-4" />
                      {isFr ? "Partager" : "Share"}
                    </Button>
                  </div>
                </div>

                {stats?.code && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{isFr ? "Code :" : "Code:"}</span>
                    <code className="font-mono font-semibold bg-muted px-2 py-0.5 rounded">{stats.code}</code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(stats.code!, "code")}>
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                )}

                {/* Quick share buttons */}
                {shareLinks && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">
                      {isFr ? "Partage rapide" : "Quick share"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer">
                          <Send className="h-3.5 w-3.5" /> Telegram
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-3.5 w-3.5" /> X
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-3.5 w-3.5" /> Facebook
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={shareLinks.email}>
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {isFr ? "Inscriptions" : "Sign-ups"}
                    </CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl tabular-nums">{stats?.total ?? 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isFr ? "Filleuls actifs" : "Active referrals"}
                    </CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl tabular-nums text-primary">{activeCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5" />
                      {isFr ? "Mois Pro gagnés" : "Pro months earned"}
                    </CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl tabular-nums text-emerald-600">{totalRewards}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Progress */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    {isFr ? "Prochaine récompense" : "Next reward"}
                  </CardTitle>
                  <Badge variant="secondary">
                    {(activeCount % 3)} / 3
                  </Badge>
                </div>
                <CardDescription>
                  {isFr
                    ? `Encore ${stats?.pendingToNextReward ?? 3} filleul(s) actif(s) pour débloquer 1 mois Pro gratuit.`
                    : `${stats?.pendingToNextReward ?? 3} more active referral(s) to unlock 1 free Pro month.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">{isFr ? "Comment ça marche" : "How it works"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { n: 1, t: isFr ? "Partage ton lien" : "Share your link", d: isFr ? "WhatsApp, email, réseaux…" : "WhatsApp, email, socials…" },
                    { n: 2, t: isFr ? "Ils s'inscrivent" : "They sign up", d: isFr ? "Et publient leur 1ère vente." : "And make their first sale." },
                    { n: 3, t: isFr ? "Tu gagnes 1 mois" : "You earn 1 month", d: isFr ? "Pro gratuit, cumulable." : "Free Pro, stackable." },
                  ].map((s) => (
                    <li key={s.n} className="rounded-xl border bg-muted/30 p-4">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                        {s.n}
                      </div>
                      <div className="font-semibold">{s.t}</div>
                      <div className="text-sm text-muted-foreground">{s.d}</div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Reward history */}
            {stats?.rewards && stats.rewards.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{isFr ? "Historique des récompenses" : "Reward history"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.rewards.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Gift className="h-4 w-4 text-emerald-600" />
                        </div>
                        <Badge variant="secondary">+{r.reward_value} {isFr ? "jours Pro" : "Pro days"}</Badge>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(r.granted_at).toLocaleDateString(isFr ? "fr-FR" : "en-US")}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Gift className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-semibold">{isFr ? "Aucune récompense pour l'instant" : "No rewards yet"}</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {isFr
                      ? "Commence à partager ton lien — la première récompense arrive dès 3 filleuls actifs."
                      : "Start sharing your link — your first reward unlocks at 3 active referrals."}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

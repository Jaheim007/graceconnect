import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useReferrals } from "@/hooks/useReferrals";
import { useI18n } from "@/i18n/I18nContext";
import { Copy, Check, Gift, Users, Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/seo/SEOHead";

export default function ReferralsPage() {
  const { stats, loading } = useReferrals();
  const { lang } = useI18n();
  const [copied, setCopied] = useState(false);

  const isFr = lang === "fr";
  const link = stats?.code ? `https://siteviral.com/?ref=${stats.code}` : "";

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(isFr ? "Lien copié !" : "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!link) return;
    const text = isFr
      ? "Rejoins-moi sur SiteViral pour vendre tes contenus en ligne !"
      : "Join me on SiteViral to sell your content online!";
    if (navigator.share) {
      try {
        await navigator.share({ title: "SiteViral", text, url: link });
      } catch {}
    } else {
      copyLink();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">{isFr ? "Chargement…" : "Loading…"}</div>;
  }

  const progress = stats ? ((stats.active % 3) / 3) * 100 : 0;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <SEOHead
        title={isFr ? "Programme de parrainage — SiteViral" : "Referral program — SiteViral"}
        description={isFr ? "Invitez vos amis et gagnez des mois Pro gratuits." : "Invite friends and earn free Pro months."}
      />

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gift className="h-8 w-8 text-primary" />
          {isFr ? "Programme de parrainage" : "Referral program"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isFr
            ? "Invitez 3 créateurs actifs et recevez 1 mois Pro offert. Cumulable à l'infini."
            : "Invite 3 active creators and get 1 free Pro month. Unlimited stacking."}
        </p>
      </div>

      {/* Code & lien */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">{isFr ? "Votre lien d'invitation" : "Your invite link"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={link} readOnly className="font-mono text-sm" />
            <Button onClick={copyLink} variant="outline" size="icon">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button onClick={share}>
              <Share2 className="h-4 w-4 mr-2" />
              {isFr ? "Partager" : "Share"}
            </Button>
          </div>
          {stats?.code && (
            <div className="text-xs text-muted-foreground">
              {isFr ? "Code : " : "Code: "}<span className="font-mono font-semibold">{stats.code}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progression */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Users className="h-3 w-3" />{isFr ? "Filleuls inscrits" : "Sign-ups"}</CardDescription>
            <CardTitle className="text-3xl">{stats?.total ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{isFr ? "Filleuls actifs" : "Active referrals"}</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats?.active ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Gift className="h-3 w-3" />{isFr ? "Mois Pro gagnés" : "Pro months earned"}</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats?.rewards.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Barre de progression vers prochaine récompense */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isFr ? "Prochaine récompense" : "Next reward"}
          </CardTitle>
          <CardDescription>
            {isFr
              ? `Encore ${stats?.pendingToNextReward ?? 3} filleul(s) actif(s) pour débloquer 1 mois Pro gratuit.`
              : `${stats?.pendingToNextReward ?? 3} more active referral(s) to unlock 1 free Pro month.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {(stats?.active ?? 0) % 3} / 3 {isFr ? "filleuls actifs" : "active referrals"}
          </p>
        </CardContent>
      </Card>

      {/* Historique récompenses */}
      {stats?.rewards && stats.rewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isFr ? "Historique des récompenses" : "Reward history"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">+{r.reward_value} {isFr ? "jours Pro" : "Pro days"}</Badge>
                  <span className="text-muted-foreground">
                    {new Date(r.granted_at).toLocaleDateString(isFr ? "fr-FR" : "en-US")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

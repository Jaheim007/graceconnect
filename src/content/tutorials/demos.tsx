import type { DemoScene } from '@/components/tutorials/DemoPlayer';
import {
  MockWindow,
  MockSidebar,
  MockCard,
  MockButton,
  MockField,
  MockBar,
  MockCursor,
  MockToast,
} from '@/components/tutorials/UiMock';

type Locale = 'fr' | 'en';

const NAV_FR = ['Accueil', 'Produits', 'Formations', 'Ventes', 'Paramètres'];
const NAV_EN = ['Home', 'Products', 'Courses', 'Sales', 'Settings'];

function Shell({
  active,
  nav,
  title,
  children,
}: {
  active: string;
  nav: string[];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <MockWindow title={title}>
      <div className="flex gap-3">
        <MockSidebar items={nav} active={active} />
        <div className="min-w-0 flex-1 space-y-2.5">{children}</div>
      </div>
    </MockWindow>
  );
}

/** Interactive walkthroughs keyed by tutorial id. */
export function getTutorialDemo(id: string, locale: Locale): DemoScene[] {
  const fr = locale === 'fr';
  const nav = fr ? NAV_FR : NAV_EN;

  switch (id) {
    case 'create-account':
      return [
        {
          caption: fr
            ? 'Cliquez sur « S’inscrire » en haut à droite du site, ou continuez avec Google en un clic.'
            : 'Click "Sign up" in the top-right corner, or continue with Google in one click.',
          render: () => (
            <MockWindow title="siteviral.com">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">SiteViral</span>
                <div className="flex items-center gap-1.5">
                  <MockButton variant="ghost">{fr ? 'Découvrir' : 'Discover'}</MockButton>
                  <MockButton pulse>{fr ? 'S’inscrire' : 'Sign up'}</MockButton>
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-xl border border-border p-3">
                <MockField label="Email" value="amina@exemple.com" typing />
                <MockField label={fr ? 'Mot de passe' : 'Password'} value="••••••••" />
                <MockButton>{fr ? 'Créer mon compte' : 'Create my account'}</MockButton>
              </div>
              <MockCursor to={{ x: 82, y: 12 }} />
            </MockWindow>
          ),
        },
        {
          caption: fr
            ? 'Choisissez votre identité : créateur, église, ONG ou communauté. Cela configure votre espace.'
            : 'Pick your identity: creator, church, NGO or community. This configures your space.',
          render: () => (
            <MockWindow title={fr ? 'Créer mon espace' : 'Create my space'}>
              <div className="grid grid-cols-2 gap-2">
                <MockCard highlight>
                  <p className="text-[11px] font-bold">{fr ? 'Créateur' : 'Creator'}</p>
                  <p className="text-[9px] text-muted-foreground">{fr ? 'Livres, formations' : 'Books, courses'}</p>
                </MockCard>
                <MockCard>
                  <p className="text-[11px] font-bold">{fr ? 'Église' : 'Church'}</p>
                  <p className="text-[9px] text-muted-foreground">{fr ? 'Dons, sermons' : 'Giving, sermons'}</p>
                </MockCard>
                <MockCard>
                  <p className="text-[11px] font-bold">ONG / NGO</p>
                  <p className="text-[9px] text-muted-foreground">{fr ? 'Campagnes' : 'Campaigns'}</p>
                </MockCard>
                <MockCard>
                  <p className="text-[11px] font-bold">{fr ? 'Communauté' : 'Community'}</p>
                  <p className="text-[9px] text-muted-foreground">{fr ? 'Membres' : 'Members'}</p>
                </MockCard>
              </div>
              <MockCursor to={{ x: 26, y: 28 }} />
            </MockWindow>
          ),
        },
        {
          caption: fr
            ? 'Nommez votre plateforme et choisissez votre devise. Votre boutique est prête.'
            : 'Name your platform and choose your currency. Your storefront is ready.',
          render: () => (
            <MockWindow title={fr ? 'Ma plateforme' : 'My platform'}>
              <div className="space-y-2">
                <MockField label={fr ? 'Nom de la plateforme' : 'Platform name'} value="Amina Éditions" typing />
                <MockField label={fr ? 'Devise' : 'Currency'} value="XOF — FCFA" />
                <MockBar value={92} label={fr ? 'Configuration' : 'Setup'} />
                <MockButton pulse>{fr ? 'Terminer' : 'Finish'}</MockButton>
              </div>
              <MockToast>{fr ? '✅ Plateforme créée' : '✅ Platform created'}</MockToast>
            </MockWindow>
          ),
        },
      ];

    case 'create-product':
      return [
        {
          caption: fr
            ? 'Dans le tableau de bord, ouvrez « Produits » puis cliquez sur « Nouveau produit ».'
            : 'In the dashboard, open "Products" then click "New product".',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Tableau de bord' : 'Dashboard'}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{fr ? 'Produits' : 'Products'}</p>
                <MockButton pulse>+ {fr ? 'Nouveau produit' : 'New product'}</MockButton>
              </div>
              <MockCard><p className="text-[10px] text-muted-foreground">{fr ? 'Aucun produit pour le moment' : 'No products yet'}</p></MockCard>
              <MockCursor to={{ x: 78, y: 18 }} />
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Ajoutez un titre clair, une description qui donne envie, et une catégorie.'
            : 'Add a clear title, a compelling description and a category.',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Nouveau produit' : 'New product'}>
              <MockField label={fr ? 'Titre' : 'Title'} value={fr ? 'Réussir sa première vente' : 'Land your first sale'} typing />
              <MockField label="Description" value={fr ? '7 chapitres pratiques pour vendre en ligne…' : '7 practical chapters to sell online…'} />
              <MockField label={fr ? 'Catégorie' : 'Category'} value={fr ? 'Ebook — Business' : 'Ebook — Business'} />
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Déposez votre fichier (PDF, ZIP, vidéo) et une couverture 1200×630 attractive.'
            : 'Drop your file (PDF, ZIP, video) and an attractive 1200×630 cover.',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Fichiers' : 'Files'}>
              <MockCard highlight className="border-dashed">
                <p className="text-[11px] font-semibold">{fr ? 'Glissez votre fichier ici' : 'Drag your file here'}</p>
                <p className="text-[9px] text-muted-foreground">reussir-premiere-vente.pdf — 4,2 Mo</p>
                <div className="mt-2"><MockBar value={100} /></div>
              </MockCard>
              <div className="flex gap-2">
                <div className="h-14 w-11 rounded-md bg-gradient-to-br from-primary/40 to-primary/10" />
                <p className="text-[9px] text-muted-foreground">{fr ? 'Couverture ajoutée' : 'Cover added'}</p>
              </div>
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Fixez le prix, activez la commission ambassadeur, puis publiez. C’est en ligne.'
            : 'Set the price, enable ambassador commission, then publish. It is live.',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Publication' : 'Publish'}>
              <div className="grid grid-cols-2 gap-2">
                <MockField label={fr ? 'Prix' : 'Price'} value="5 000 FCFA" />
                <MockField label={fr ? 'Commission' : 'Commission'} value="25%" />
              </div>
              <div className="flex items-center gap-1.5">
                <MockButton variant="ghost">{fr ? 'Enregistrer le brouillon' : 'Save draft'}</MockButton>
                <MockButton pulse>{fr ? 'Publier maintenant' : 'Publish now'}</MockButton>
              </div>
              <MockToast>{fr ? '🎉 Produit publié' : '🎉 Product published'}</MockToast>
              <MockCursor to={{ x: 70, y: 62 }} />
            </Shell>
          ),
        },
      ];

    case 'sell-products':
      return [
        {
          caption: fr
            ? 'Complétez le KYC dans Paramètres : c’est ce qui débloque vos versements.'
            : 'Complete KYC in Settings: this is what unlocks your payouts.',
          render: () => (
            <Shell active={nav[4]} nav={nav} title={fr ? 'Paramètres — KYC' : 'Settings — KYC'}>
              <MockCard highlight>
                <p className="text-[11px] font-bold">{fr ? 'Vérification d’identité' : 'Identity verification'}</p>
                <p className="text-[9px] text-muted-foreground">{fr ? 'Pièce d’identité + selfie' : 'ID document + selfie'}</p>
                <div className="mt-2"><MockBar value={66} label={fr ? 'Progression' : 'Progress'} /></div>
              </MockCard>
              <MockCursor to={{ x: 55, y: 40 }} />
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Ajoutez votre Mobile Money (Orange, MTN, Wave) ou vos coordonnées bancaires.'
            : 'Add your Mobile Money (Orange, MTN, Wave) or bank details.',
          render: () => (
            <Shell active={nav[4]} nav={nav} title={fr ? 'Versements' : 'Payouts'}>
              <MockField label={fr ? 'Méthode' : 'Method'} value="Mobile Money — MTN" />
              <MockField label={fr ? 'Numéro' : 'Number'} value="+225 07 •• •• •• 42" typing />
              <MockButton>{fr ? 'Enregistrer' : 'Save'}</MockButton>
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Partagez votre lien ou votre flyer sur WhatsApp. Chaque partage crée du trafic.'
            : 'Share your link or flyer on WhatsApp. Every share creates traffic.',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Partager' : 'Share'}>
              <MockCard>
                <p className="text-[10px] font-mono text-muted-foreground">siteviral.com/p/premiere-vente</p>
              </MockCard>
              <div className="flex gap-1.5">
                <MockButton pulse>WhatsApp</MockButton>
                <MockButton variant="ghost">{fr ? 'Flyer' : 'Flyer'}</MockButton>
                <MockButton variant="ghost">QR</MockButton>
              </div>
              <MockCursor to={{ x: 34, y: 66 }} />
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Suivez vos ventes en direct. Les fonds sont versés après la période de rétention.'
            : 'Track sales live. Funds are paid out after the holding period.',
          render: () => (
            <Shell active={nav[3]} nav={nav} title={fr ? 'Ventes' : 'Sales'}>
              <div className="grid grid-cols-3 gap-2">
                <MockCard><p className="text-[9px] text-muted-foreground">{fr ? 'Ventes' : 'Sales'}</p><p className="text-sm font-bold">18</p></MockCard>
                <MockCard><p className="text-[9px] text-muted-foreground">{fr ? 'Revenus' : 'Revenue'}</p><p className="text-sm font-bold">90 000</p></MockCard>
                <MockCard><p className="text-[9px] text-muted-foreground">{fr ? 'Disponible' : 'Available'}</p><p className="text-sm font-bold">64 500</p></MockCard>
              </div>
              <MockBar value={78} label={fr ? 'Objectif du mois' : 'Monthly goal'} />
              <MockToast>{fr ? '💰 Nouvelle vente' : '💰 New sale'}</MockToast>
            </Shell>
          ),
        },
      ];

    case 'ambassador':
      return [
        {
          caption: fr
            ? 'Ouvrez « Gagner » pour voir les produits qui offrent une commission.'
            : 'Open "Earn" to see products offering a commission.',
          render: () => (
            <MockWindow title={fr ? 'Gagner' : 'Earn'}>
              <div className="grid grid-cols-3 gap-2">
                {[25, 30, 15].map((pct, i) => (
                  <MockCard key={i} highlight={i === 0}>
                    <div className="h-10 rounded-md bg-gradient-to-br from-primary/30 to-primary/5" />
                    <p className="mt-1.5 text-[10px] font-semibold">{fr ? 'Ebook' : 'Ebook'} #{i + 1}</p>
                    <p className="text-[9px] text-primary">{pct}% {fr ? 'commission' : 'commission'}</p>
                  </MockCard>
                ))}
              </div>
              <MockCursor to={{ x: 22, y: 45 }} />
            </MockWindow>
          ),
        },
        {
          caption: fr
            ? 'Cliquez sur « Promouvoir » : votre lien unique est généré instantanément.'
            : 'Click "Promote": your unique link is generated instantly.',
          render: () => (
            <MockWindow title={fr ? 'Mon lien ambassadeur' : 'My ambassador link'}>
              <MockCard highlight>
                <p className="text-[10px] font-mono text-muted-foreground">siteviral.com/p/ebook-1?ref=AMINA24</p>
              </MockCard>
              <div className="mt-2 flex gap-1.5">
                <MockButton pulse>{fr ? 'Copier' : 'Copy'}</MockButton>
                <MockButton variant="ghost">WhatsApp</MockButton>
              </div>
              <MockToast>{fr ? '🔗 Lien copié' : '🔗 Link copied'}</MockToast>
            </MockWindow>
          ),
        },
        {
          caption: fr
            ? 'Suivez clics, conversions et commissions, puis retirez via Mobile Money.'
            : 'Track clicks, conversions and commissions, then withdraw via Mobile Money.',
          render: () => (
            <MockWindow title={fr ? 'Performances' : 'Performance'}>
              <div className="grid grid-cols-3 gap-2">
                <MockCard><p className="text-[9px] text-muted-foreground">{fr ? 'Clics' : 'Clicks'}</p><p className="text-sm font-bold">412</p></MockCard>
                <MockCard><p className="text-[9px] text-muted-foreground">{fr ? 'Ventes' : 'Sales'}</p><p className="text-sm font-bold">23</p></MockCard>
                <MockCard><p className="text-[9px] text-muted-foreground">{fr ? 'Gains' : 'Earnings'}</p><p className="text-sm font-bold">28 750</p></MockCard>
              </div>
              <MockBar value={64} label={fr ? 'Taux de conversion' : 'Conversion rate'} />
            </MockWindow>
          ),
        },
      ];

    case 'kyc':
      return [
        {
          caption: fr
            ? 'Tableau de bord → Paramètres → Vérification d’identité (KYC).'
            : 'Dashboard → Settings → Identity verification (KYC).',
          render: () => (
            <Shell active={nav[4]} nav={nav} title={fr ? 'Paramètres' : 'Settings'}>
              <MockCard highlight>
                <p className="text-[11px] font-bold">{fr ? 'Vérification d’identité' : 'Identity verification'}</p>
                <p className="text-[9px] text-muted-foreground">{fr ? 'Requis pour les versements' : 'Required for payouts'}</p>
              </MockCard>
              <MockCard><p className="text-[10px] text-muted-foreground">{fr ? 'Devise, langue, notifications' : 'Currency, language, notifications'}</p></MockCard>
              <MockCursor to={{ x: 52, y: 30 }} />
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Niveau 1 : pièce d’identité nette + selfie. Évitez les reflets et les flous.'
            : 'Level 1: sharp ID document + selfie. Avoid glare and blur.',
          render: () => (
            <Shell active={nav[4]} nav={nav} title="KYC — 1">
              <div className="grid grid-cols-2 gap-2">
                <MockCard highlight className="border-dashed"><p className="text-[10px] font-semibold">{fr ? 'Pièce d’identité' : 'ID document'}</p><div className="mt-1.5"><MockBar value={100} /></div></MockCard>
                <MockCard className="border-dashed"><p className="text-[10px] font-semibold">Selfie</p><div className="mt-1.5"><MockBar value={48} /></div></MockCard>
              </div>
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Validation sous 24–48h. Une fois approuvé, vos versements sont débloqués.'
            : 'Reviewed within 24–48h. Once approved, your payouts are unlocked.',
          render: () => (
            <Shell active={nav[4]} nav={nav} title="KYC">
              <MockCard highlight>
                <p className="text-[11px] font-bold">{fr ? 'Statut : approuvé' : 'Status: approved'}</p>
                <p className="text-[9px] text-muted-foreground">{fr ? 'Versements Mobile Money actifs' : 'Mobile Money payouts active'}</p>
              </MockCard>
              <MockToast>{fr ? '🔓 Versements débloqués' : '🔓 Payouts unlocked'}</MockToast>
            </Shell>
          ),
        },
      ];

    case 'chariow-import':
      return [
        {
          caption: fr
            ? 'Sur Chariow : Paramètres → API Keys → créez une clé et copiez-la.'
            : 'On Chariow: Settings → API Keys → create a key and copy it.',
          render: () => (
            <MockWindow title="app.chariow.com">
              <MockField label="API key" value="ch_live_••••••••••••3f21" typing />
              <div className="mt-2"><MockButton pulse>{fr ? 'Copier la clé' : 'Copy key'}</MockButton></div>
            </MockWindow>
          ),
        },
        {
          caption: fr
            ? 'Sur SiteViral : Produits → « Importer depuis Chariow », collez la clé.'
            : 'On SiteViral: Products → "Import from Chariow", paste the key.',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Import' : 'Import'}>
              <MockField label="API key" value="ch_live_••••••••••••3f21" />
              <MockButton pulse>{fr ? 'Connecter' : 'Connect'}</MockButton>
              <MockCursor to={{ x: 40, y: 70 }} />
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Cochez les produits à importer : titres, descriptions, prix et couvertures sont copiés.'
            : 'Tick the products to import: titles, descriptions, prices and covers are copied.',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Sélection' : 'Selection'}>
              {[1, 2, 3].map((i) => (
                <MockCard key={i} highlight={i < 3}>
                  <p className="text-[10px] font-semibold">{fr ? 'Produit' : 'Product'} {i}</p>
                  <p className="text-[9px] text-muted-foreground">{i < 3 ? (fr ? 'Sélectionné' : 'Selected') : (fr ? 'Ignoré' : 'Skipped')}</p>
                </MockCard>
              ))}
            </Shell>
          ),
        },
        {
          caption: fr
            ? 'Téléchargez vos fichiers depuis Chariow, uploadez-les ici, puis publiez.'
            : 'Download your files from Chariow, upload them here, then publish.',
          render: () => (
            <Shell active={nav[1]} nav={nav} title={fr ? 'Finaliser' : 'Finalize'}>
              <MockCard highlight className="border-dashed">
                <p className="text-[10px] font-semibold">{fr ? 'Uploader le fichier' : 'Upload the file'}</p>
                <div className="mt-1.5"><MockBar value={100} /></div>
              </MockCard>
              <MockButton pulse>{fr ? 'Publier' : 'Publish'}</MockButton>
              <MockToast>{fr ? '✅ 2 produits importés' : '✅ 2 products imported'}</MockToast>
            </Shell>
          ),
        },
      ];

    default:
      return [];
  }
}

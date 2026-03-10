import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { FileUploader } from '@/components/ui/FileUploader';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, CheckCircle, XCircle, Clock, Shield, Camera, User,
  CreditCard, FileText, ArrowRight, ArrowLeft, Upload, Smartphone, Building
} from 'lucide-react';

// ── Types ──
type VerificationMode = 'org' | 'partner';
type VerificationType = 'individual' | 'organization';

interface Props {
  mode: VerificationMode;
  entityId: string;
  status: string; // 'none' | 'pending' | 'approved' | 'rejected' | 'level1' | 'level2'
  rejectionReason?: string | null;
  orgCategory?: string;
}

const DOC_TYPES = [
  { value: 'national_id', label: "Carte Nationale d'Identité", hasBack: true, icon: '🪪' },
  { value: 'passport', label: 'Passeport', hasBack: false, icon: '📘' },
  { value: 'drivers_license', label: 'Permis de conduire', hasBack: true, icon: '🚗' },
];

// ── Organization document types by category ──
const ORG_DOC_TYPES_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  church: [
    { value: 'church_certificate', label: "Récépissé / Attestation d'existence" },
    { value: 'church_registration', label: "Certificat d'enregistrement religieux" },
    { value: 'church_statutes', label: 'Statuts de la communauté' },
  ],
  ministry: [
    { value: 'ministry_registration', label: "Certificat d'enregistrement" },
    { value: 'ministry_statutes', label: 'Statuts du ministère' },
    { value: 'ministry_authorization', label: 'Autorisation ministérielle' },
  ],
  ngo: [
    { value: 'ngo_registration', label: "Récépissé de déclaration / Certificat d'enregistrement" },
    { value: 'ngo_statutes', label: "Statuts de l'association / ONG" },
    { value: 'ngo_authorization', label: 'Agrément / Autorisation officielle' },
  ],
  leader: [
    { value: 'proof_of_address', label: 'Justificatif de domicile (< 3 mois)' },
    { value: 'business_registration', label: 'Registre du commerce (si applicable)' },
  ],
  community: [
    { value: 'community_registration', label: "Récépissé de l'association" },
    { value: 'community_statutes', label: 'Statuts de la communauté' },
    { value: 'community_minutes', label: 'PV de la dernière assemblée' },
  ],
  other: [
    { value: 'org_registration', label: "Certificat d'enregistrement" },
    { value: 'org_statutes', label: 'Statuts' },
    { value: 'org_authorization', label: 'Autorisation officielle' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  church: 'Église / Communauté religieuse',
  ministry: 'Ministère',
  ngo: 'ONG / Association',
  leader: 'Leader / Créateur individuel',
  community: 'Communauté',
  other: 'Organisation',
};

const CATEGORY_ORG_DOC_HINTS: Record<string, string> = {
  church: "Documents officiels de votre église (récépissé, attestation, statuts).",
  ministry: "Documents officiels de votre ministère (certificat, statuts, autorisation).",
  ngo: "Documents officiels de votre ONG/association (récépissé, statuts, agrément).",
  leader: "Justificatif de domicile ou registre du commerce si applicable.",
  community: "Documents officiels de votre communauté (récépissé, statuts, PV).",
  other: "Documents officiels de votre organisation (certificat, statuts, autorisation).",
};

// ── Build steps dynamically based on mode and verification type ──
function getSteps(mode: VerificationMode, verificationType: VerificationType | null) {
  const steps: { id: string; label: string; icon: typeof FileText }[] = [
    { id: 'choose_type', label: 'Type de vérification', icon: Shield },
  ];

  // Only add remaining steps once type is chosen
  if (verificationType) {
    steps.push(
      { id: 'doc_type', label: 'Type de document', icon: FileText },
      { id: 'document', label: 'Document d\'identité', icon: CreditCard },
      { id: 'selfie', label: 'Selfie', icon: User },
      { id: 'selfie_doc', label: 'Selfie + Document', icon: Camera },
    );

    // For organizations: add org documents step (KYB)
    if (verificationType === 'organization' && mode === 'org') {
      steps.push({ id: 'org_docs', label: 'Documents organisation', icon: Building });
    }

    // Payout for org mode
    if (mode === 'org') {
      steps.push({ id: 'payout', label: 'Méthode de paiement', icon: Smartphone });
    }

    steps.push({ id: 'review', label: 'Vérification', icon: CheckCircle });
  }

  return steps;
}

export default function IdentityVerificationWizard({ mode, entityId, status, rejectionReason, orgCategory }: Props) {
  const [verificationType, setVerificationType] = useState<VerificationType | null>(null);
  const [step, setStep] = useState(0);
  const [docType, setDocType] = useState('national_id');
  const [docFrontUrl, setDocFrontUrl] = useState('');
  const [docBackUrl, setDocBackUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [selfieWithDocUrl, setSelfieWithDocUrl] = useState('');
  
  // Org document state (KYB)
  const [orgDocType, setOrgDocType] = useState('');
  const [orgDocUrl, setOrgDocUrl] = useState('');
  
  // Payout state
  const [payoutMethod, setPayoutMethod] = useState<'mobile_money' | 'bank'>('mobile_money');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [payoutProvider, setPayoutProvider] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedDoc = DOC_TYPES.find(d => d.value === docType)!;
  const folder = mode === 'org' ? `kyc/${entityId}` : `partner-kyc/${entityId}`;
  const activeSteps = getSteps(mode, verificationType);
  const currentStep = activeSteps[step];
  const totalSteps = activeSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  // Org doc types for the category
  const orgDocTypes = ORG_DOC_TYPES_BY_CATEGORY[orgCategory || 'other'] || ORG_DOC_TYPES_BY_CATEGORY.other;

  // Set default org doc type
  if (mode === 'org' && !orgDocType && orgDocTypes.length > 0) {
    setOrgDocType(orgDocTypes[0].value);
  }

  const canProceed = useCallback(() => {
    switch (currentStep?.id) {
      case 'choose_type': return !!verificationType;
      case 'doc_type': return !!docType;
      case 'document': return !!docFrontUrl && (!selectedDoc.hasBack || !!docBackUrl);
      case 'selfie': return !!selfieUrl;
      case 'selfie_doc': return !!selfieWithDocUrl;
      case 'org_docs': return !!orgDocUrl;
      case 'payout':
        if (payoutMethod === 'mobile_money') return !!accountNumber && !!accountName && !!payoutProvider;
        return !!bankName && !!accountNumber && !!accountName;
      case 'review': return true;
      default: return false;
    }
  }, [currentStep?.id, verificationType, docType, docFrontUrl, docBackUrl, selfieUrl, selfieWithDocUrl, orgDocUrl, payoutMethod, accountNumber, accountName, payoutProvider, bankName, selectedDoc]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === 'org') {
        const { error } = await db.rpc('submit_org_kyc', {
          _org_id: entityId,
          _kyc_level: 1,
          _id_document_url: docFrontUrl,
          _id_document_type: docType,
          _id_document_back_url: docBackUrl || null,
          _selfie_url: selfieUrl,
          _selfie_with_doc_url: selfieWithDocUrl,
          _org_document_url: verificationType === 'organization' ? (orgDocUrl || null) : null,
          _org_document_type: verificationType === 'organization' ? (orgDocType || null) : null,
          _verification_type: verificationType,
          _bank_account_name: accountName || null,
          _bank_account_number: accountNumber || null,
          _bank_name: payoutMethod === 'bank' ? bankName : payoutProvider,
          _payout_method: payoutMethod,
          _payout_phone: payoutMethod === 'mobile_money' ? accountNumber : null,
          _payout_provider: payoutProvider || null,
        });
        if (error) throw error;
      } else {
        const { error } = await db.rpc('submit_partner_kyc', {
          _partner_id: entityId,
          _id_document_url: docFrontUrl,
          _id_document_type: docType,
          _id_document_back_url: docBackUrl || null,
          _selfie_url: selfieUrl,
          _selfie_with_doc_url: selfieWithDocUrl,
        });
        if (error) throw error;
      }
      setSubmitted(true);
      toast.success('Documents soumis avec succès !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status screens ──
  if (status === 'approved' || status === 'level1' || status === 'level2') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
            </motion.div>
            <div>
              <p className="text-lg font-bold">Compte vérifié ✅</p>
              <p className="text-sm text-muted-foreground">
                Votre vérification a été approuvée. Vous pouvez effectuer des retraits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'pending') {
    return (
      <Card className="border-secondary/30 bg-secondary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            >
              <Clock className="h-12 w-12 text-muted-foreground" />
            </motion.div>
            <div>
              <p className="text-lg font-bold">Vérification en cours</p>
              <p className="text-sm text-muted-foreground">
                Vos documents sont en cours d'examen.<br />
                Délai de traitement : <strong>72 heures ouvrées</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Vous serez notifié dès que la vérification sera terminée.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Success screen after submission ──
  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 py-10 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            >
              <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-14 w-14 text-green-600" />
              </div>
            </motion.div>
            <div>
              <p className="text-2xl font-bold text-primary">Merci !</p>
              <p className="text-sm text-muted-foreground mt-2">
                Nous avons bien reçu vos documents.<br />
                Ils sont en cours de vérification.<br />
                Vous serez notifié du résultat sous <strong>72 heures</strong>.
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="w-full max-w-xs"
            >
              Terminé
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-lg font-bold">
              {verificationType === 'organization' ? 'Vérification organisation' : 
               verificationType === 'individual' ? 'Vérification créateur' : 
               'Vérification de compte'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {!verificationType 
              ? "Choisissez votre type de vérification pour commencer."
              : verificationType === 'organization'
                ? "Identité du responsable + documents officiels de l'organisation."
                : "Vos documents personnels. Stockés de manière sécurisée et chiffrée."}
          </p>
          {verificationType === 'organization' && orgCategory && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Building className="h-3 w-3" />
              {CATEGORY_LABELS[orgCategory] || orgCategory}
            </div>
          )}
        </div>

        {/* ── Rejection banner ── */}
        {status === 'rejected' && rejectionReason && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30"
          >
            <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Vérification refusée</p>
              <p className="text-xs text-muted-foreground">{rejectionReason}</p>
              <p className="text-xs text-muted-foreground mt-1">Veuillez soumettre de nouveaux documents.</p>
            </div>
          </motion.div>
        )}

        {/* ── Progress bar ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Étape {step + 1} sur {totalSteps}</span>
            <span>{currentStep.label}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between px-1">
            {activeSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className={`flex flex-col items-center gap-0.5 ${i <= step ? 'text-primary' : 'text-muted-foreground/40'}`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                    i < step ? 'bg-primary text-primary-foreground' :
                    i === step ? 'bg-primary/20 ring-2 ring-primary' :
                    'bg-muted'
                  }`}>
                    {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3 w-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[300px]"
          >
            {/* STEP: Choose verification type */}
            {currentStep?.id === 'choose_type' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <h3 className="text-xl font-bold">Vous vérifiez en tant que…</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choisissez le type qui correspond à votre situation <strong>réelle</strong>, 
                    quel que soit le type de compte que vous avez créé sur la plateforme.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    ℹ️ <strong>Pourquoi cette question ?</strong> Avoir créé un compte « organisation » ne signifie pas forcément que vous représentez une entité légale. 
                    Inversement, un compte « créateur » peut être géré par une vraie organisation. 
                    Choisissez ce qui reflète votre <strong>réalité juridique</strong>.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Individual option */}
                  <button
                    onClick={() => setVerificationType('individual')}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      verificationType === 'individual'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">👤 Personne / Créateur individuel</p>
                        {verificationType === 'individual' && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vous agissez en votre nom propre. Vous n'avez pas de structure légale enregistrée (pas d'association, d'entreprise ou d'ONG).
                      </p>
                      <p className="text-[10px] text-primary/70 mt-1.5 font-medium">
                        → Résultat : « Créateur vérifié ✅ »
                      </p>
                    </div>
                  </button>

                  {/* Organization option */}
                  <button
                    onClick={() => setVerificationType('organization')}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      verificationType === 'organization'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">🏢 Organisation / Entité légale</p>
                        {verificationType === 'organization' && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vous représentez une structure officiellement enregistrée : église, association, ONG, entreprise, communauté, etc. 
                        Vous devrez fournir les documents de l'organisation en plus de votre pièce d'identité.
                      </p>
                      <p className="text-[10px] text-primary/70 mt-1.5 font-medium">
                        → Résultat : « Organisation vérifiée ✅ »
                      </p>
                    </div>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-[11px] text-amber-800 dark:text-amber-200">
                    ⚠️ <strong>Important :</strong> Choisir « Organisation » alors que vous êtes un individu (ou l'inverse) peut entraîner un rejet de votre vérification. Soyez honnête dans votre choix.
                  </p>
                </div>
              </div>
            )}

            {/* STEP: Document type */}
            {currentStep?.id === 'doc_type' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <h3 className="text-xl font-bold">
                    {verificationType === 'organization' 
                      ? "Pièce d'identité du responsable" 
                      : "Votre pièce d'identité"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {verificationType === 'organization'
                      ? "Document d'identité du responsable légal de l'organisation"
                      : "Choisissez un document d'identité valide"}
                  </p>
                </div>
                <div className="space-y-3">
                  {DOC_TYPES.map(doc => (
                    <button
                      key={doc.value}
                      onClick={() => setDocType(doc.value)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        docType === doc.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{doc.icon}</span>
                        <div className="text-left">
                          <p className="font-medium text-sm">{doc.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.hasBack ? 'Recto et verso requis' : 'Face unique'}
                          </p>
                        </div>
                      </div>
                      {docType === doc.value && (
                        <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP: Document photos */}
            {currentStep?.id === 'document' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <h3 className="text-xl font-bold">Photo de votre {selectedDoc.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Prenez une photo claire dans un environnement bien éclairé
                  </p>
                </div>
                <div className="space-y-2 bg-muted/40 p-3 rounded-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">☀️</span>
                    <div>
                      <p className="text-xs font-medium">Bonne luminosité</p>
                      <p className="text-[10px] text-muted-foreground">Photo lisible, sans reflet ni ombre</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">🔍</span>
                    <div>
                      <p className="text-xs font-medium">Image nette</p>
                      <p className="text-[10px] text-muted-foreground">Le texte du document doit être lisible</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {selectedDoc.hasBack ? 'Recto (face avant) *' : 'Photo du document *'}
                  </Label>
                  <CameraCapture
                    value={docFrontUrl}
                    onChange={setDocFrontUrl}
                    folder={`${folder}/doc-front`}
                    bucket="kyc-documents"
                    label={selectedDoc.hasBack ? 'Face avant du document' : selectedDoc.label}
                    hint="Prenez une photo claire du document entier"
                  />
                </div>
                {selectedDoc.hasBack && (
                  <div>
                    <Label className="text-sm font-semibold">Verso (face arrière) *</Label>
                    <CameraCapture
                      value={docBackUrl}
                      onChange={setDocBackUrl}
                      folder={`${folder}/doc-back`}
                      bucket="kyc-documents"
                      label="Face arrière du document"
                      hint="Retournez le document et prenez une photo du verso"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP: Selfie */}
            {currentStep?.id === 'selfie' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Prenez un selfie</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assurez-vous que votre visage est clairement visible
                  </p>
                </div>
                <div className="space-y-2 bg-muted/40 p-3 rounded-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">👤</span>
                    <p className="text-xs text-muted-foreground">Visage dégagé (pas de lunettes de soleil, chapeau, masque)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">💡</span>
                    <p className="text-xs text-muted-foreground">Bonne luminosité, fond neutre si possible</p>
                  </div>
                </div>
                <CameraCapture
                  value={selfieUrl}
                  onChange={setSelfieUrl}
                  folder={`${folder}/selfie`}
                  bucket="kyc-documents"
                  label="Selfie"
                  hint="Utilisez la caméra frontale pour prendre un selfie clair"
                />
              </div>
            )}

            {/* STEP: Selfie with document */}
            {currentStep?.id === 'selfie_doc' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Selfie avec votre document</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tenez votre {selectedDoc.label.toLowerCase()} à côté de votre visage
                  </p>
                </div>
                <div className="space-y-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">📸 Comment faire :</p>
                  <ul className="text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• Tenez votre document à côté de votre visage</li>
                    <li>• Les deux doivent être visibles et nets</li>
                    <li>• Le texte du document doit être lisible</li>
                  </ul>
                </div>
                <CameraCapture
                  value={selfieWithDocUrl}
                  onChange={setSelfieWithDocUrl}
                  folder={`${folder}/selfie-with-doc`}
                  bucket="kyc-documents"
                  label="Selfie avec document"
                  hint="Prenez un selfie en tenant votre pièce d'identité visible à côté de votre visage"
                />
              </div>
            )}

            {/* STEP: Organization documents (KYB — org mode only) */}
            {currentStep?.id === 'org_docs' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Documents de l'organisation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {CATEGORY_ORG_DOC_HINTS[orgCategory || 'other'] || CATEGORY_ORG_DOC_HINTS.other}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Type de document *</Label>
                  <Select value={orgDocType} onValueChange={setOrgDocType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {orgDocTypes.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Document officiel *</Label>
                  <FileUploader
                    value={orgDocUrl}
                    onChange={setOrgDocUrl}
                    folder={`kyc/${entityId}/org-docs`}
                    bucket="kyc-documents"
                    accept="image/*,.pdf"
                    label="Document de l'organisation"
                    hint="Récépissé, certificat, statuts ou autorisation officielle (PDF ou image)"
                    hideUrlMode
                  />
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground">
                    💡 Ces documents prouvent l'existence légale de votre organisation et sont nécessaires pour activer les retraits.
                  </p>
                </div>
              </div>
            )}

            {/* STEP: Payout method (org only) */}
            {currentStep?.id === 'payout' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <h3 className="text-xl font-bold">Méthode de paiement</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comment souhaitez-vous recevoir vos versements ?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPayoutMethod('mobile_money')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      payoutMethod === 'mobile_money'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Smartphone className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Mobile Money</p>
                    <p className="text-[10px] text-muted-foreground">MTN, Orange, Wave...</p>
                  </button>
                  <button
                    onClick={() => setPayoutMethod('bank')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      payoutMethod === 'bank'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Virement bancaire</p>
                    <p className="text-[10px] text-muted-foreground">Compte bancaire</p>
                  </button>
                </div>

                {payoutMethod === 'mobile_money' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Opérateur *</Label>
                      <Select value={payoutProvider} onValueChange={setPayoutProvider}>
                        <SelectTrigger><SelectValue placeholder="Choisir l'opérateur" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="orange_money">Orange Money</SelectItem>
                          <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                          <SelectItem value="moov_money">Moov Money</SelectItem>
                          <SelectItem value="wave">Wave</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Numéro de téléphone *</Label>
                      <Input
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="+225 07XXXXXXXX"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Nom du titulaire *</Label>
                      <Input
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        placeholder="Nom complet tel qu'affiché sur le compte"
                      />
                    </div>
                  </div>
                )}

                {payoutMethod === 'bank' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Nom de la banque *</Label>
                      <Input
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="Ex: Ecobank, SIB, SGCI..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Numéro de compte *</Label>
                      <Input
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="Numéro de compte bancaire"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Nom du titulaire *</Label>
                      <Input
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        placeholder="Nom complet tel qu'il apparaît sur le compte"
                      />
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground text-center">
                  ⚠️ Le compte doit être à votre nom. Ces informations seront verrouillées après le premier versement.
                </p>
              </div>
            )}

            {/* STEP: Review */}
            {currentStep?.id === 'review' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <h3 className="text-xl font-bold">Vérifiez vos informations</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {verificationType === 'organization' 
                      ? 'Vérification en tant qu\'organisation. Assurez-vous que tout est correct.'
                      : 'Vérification en tant que créateur individuel. Assurez-vous que tout est correct.'}
                  </p>
                </div>

                {/* Verification type badge */}
                <div className="flex justify-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    verificationType === 'organization' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-accent text-accent-foreground'
                  }`}>
                    {verificationType === 'organization' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    {verificationType === 'organization' ? 'Organisation vérifiée' : 'Créateur vérifié'}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Document */}
                  <ReviewItem
                    label={`${selectedDoc.label} (recto)`}
                    imageUrl={docFrontUrl}
                    onEdit={() => setStep(activeSteps.findIndex(s => s.id === 'document'))}
                  />
                  {selectedDoc.hasBack && docBackUrl && (
                    <ReviewItem
                      label={`${selectedDoc.label} (verso)`}
                      imageUrl={docBackUrl}
                      onEdit={() => setStep(activeSteps.findIndex(s => s.id === 'document'))}
                    />
                  )}
                  {/* Selfie */}
                  <ReviewItem
                    label="Selfie"
                    imageUrl={selfieUrl}
                    isRound
                    onEdit={() => setStep(activeSteps.findIndex(s => s.id === 'selfie'))}
                  />
                  {/* Selfie with doc */}
                  <ReviewItem
                    label="Selfie + Document"
                    imageUrl={selfieWithDocUrl}
                    onEdit={() => setStep(activeSteps.findIndex(s => s.id === 'selfie_doc'))}
                  />
                  {/* Org document (org mode) */}
                  {verificationType === 'organization' && orgDocUrl && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Document organisation</p>
                          <p className="text-sm font-medium">
                            {orgDocTypes.find(d => d.value === orgDocType)?.label || orgDocType}
                          </p>
                          <p className="text-xs text-green-600">✓ Document ajouté</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => setStep(activeSteps.findIndex(s => s.id === 'org_docs'))}
                        >
                          Modifier
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Payout info (org only) */}
                  {mode === 'org' && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Méthode de paiement</p>
                          <p className="text-sm font-medium">
                            {payoutMethod === 'mobile_money' ? `Mobile Money · ${accountNumber}` : `Banque · ${bankName}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{accountName}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => setStep(activeSteps.findIndex(s => s.id === 'payout'))}
                        >
                          Modifier
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-muted/40 p-3 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground">
                    🔒 En soumettant, vous confirmez que ces documents vous appartiennent et sont authentiques.
                    La vérification prend en moyenne <strong>72 heures</strong>.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ── */}
        <div className="flex items-center gap-3 pt-2">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
          )}
          {currentStep?.id !== 'review' ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continuer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Soumettre la vérification
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Review item component ──
function ReviewItem({ label, imageUrl, isRound, onEdit }: { label: string; imageUrl: string; isRound?: boolean; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
      <img
        src={imageUrl}
        alt={label}
        className={`h-16 w-16 object-cover ${isRound ? 'rounded-full' : 'rounded-lg'}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-green-600">✓ Photo ajoutée</p>
      </div>
      <Button size="sm" variant="ghost" className="text-xs shrink-0" onClick={onEdit}>
        Modifier
      </Button>
    </div>
  );
}

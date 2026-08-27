import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/ui/FileUploader';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, Shield, CheckCircle, XCircle, Clock, Upload,
  User, Building, FileText, CreditCard, AlertTriangle, Info
} from 'lucide-react';
import type { OrgCategory } from '@/types/database';

interface Props {
  orgId: string;
  orgCategory: OrgCategory;
  kycStatus: string;
}

// ── Document types by category ──
const ID_DOC_TYPES = [
  { value: 'national_id', label: "Carte Nationale d'Identité" },
  { value: 'passport', label: 'Passeport' },
  { value: 'drivers_license', label: 'Permis de conduire' },
  { value: 'residence_permit', label: 'Titre de séjour' },
];

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
  leader: 'Leader / Créateur',
  community: 'Communauté',
  other: 'Autre',
};

const CATEGORY_LEVEL1_HINTS: Record<string, string> = {
  church: "Pièce d'identité du pasteur ou responsable principal de l'église.",
  ministry: "Pièce d'identité du responsable du ministère.",
  ngo: "Pièce d'identité du représentant légal de l'ONG ou association.",
  leader: "Votre pièce d'identité personnelle en tant que créateur ou leader.",
  community: "Pièce d'identité du président ou responsable de la communauté.",
  other: "Pièce d'identité du représentant légal de l'organisation.",
};

const CATEGORY_LEVEL2_HINTS: Record<string, string> = {
  church: "Documents officiels de votre église (récépissé, attestation, statuts). Ces documents prouvent l'existence légale de votre communauté.",
  ministry: "Documents officiels de votre ministère (certificat, statuts, autorisation).",
  ngo: "Documents officiels de votre ONG/association (récépissé, statuts, agrément).",
  leader: "En tant que leader/créateur individuel, un justificatif de domicile suffit. Si vous avez une structure enregistrée, fournissez le registre du commerce.",
  community: "Documents officiels de votre communauté (récépissé, statuts, PV d'assemblée).",
  other: "Documents officiels de votre organisation (certificat, statuts, autorisation).",
};

export default function OrgKYCForm({ orgId, orgCategory, kycStatus }: Props) {
  // ── Fetch existing submission ──
  const { data: submission, isLoading } = useQuery({
    queryKey: ['kyc-submission', orgId],
    queryFn: async () => {
      const { data } = await db
        .from('kyc_submissions')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      return data;
    },
  });

  const isLevel1Approved = kycStatus === 'level1';
  const isLevel2Approved = kycStatus === 'level2';
  const isPending = kycStatus === 'pending';
  const isRejected = kycStatus === 'rejected';

  // Determine which tab to show
  const defaultTab = isLevel1Approved ? 'level2' : 'level1';

  // ── Level 1 state ──
  const [idDocType, setIdDocType] = useState('national_id');
  const [idDocUrl, setIdDocUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');

  // ── Level 2 state ──
  const [orgDocType, setOrgDocType] = useState('');
  const [orgDocUrl, setOrgDocUrl] = useState('');

  // ── Bank state (collected at Level 1) ──
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from existing submission
  useEffect(() => {
    if (submission) {
      if (submission.id_document_type) setIdDocType(submission.id_document_type);
      if (submission.id_document_url) setIdDocUrl(submission.id_document_url);
      if (submission.org_document_type) setOrgDocType(submission.org_document_type);
      if (submission.org_document_url) setOrgDocUrl(submission.org_document_url);
      if (submission.bank_name) setBankName(submission.bank_name);
      if (submission.bank_account_name) setBankAccountName(submission.bank_account_name);
      if (submission.bank_account_number) setBankAccountNumber(submission.bank_account_number);
    }
  }, [submission]);

  // Set default org doc type
  useEffect(() => {
    const docTypes = ORG_DOC_TYPES_BY_CATEGORY[orgCategory] || ORG_DOC_TYPES_BY_CATEGORY.other;
    if (!orgDocType && docTypes.length > 0) {
      setOrgDocType(docTypes[0].value);
    }
  }, [orgCategory, orgDocType]);

  const handleSubmitLevel1 = async () => {
    if (!idDocUrl) { toast.error("Veuillez uploader votre pièce d'identité"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await db.rpc('submit_org_kyc', {
        _org_id: orgId,
        _kyc_level: 1,
        _id_document_url: idDocUrl,
        _id_document_type: idDocType,
        _selfie_url: selfieUrl || undefined,
        _bank_account_name: bankAccountName || undefined,
        _bank_account_number: bankAccountNumber || undefined,
        _bank_name: bankName || undefined,
      });
      if (error) throw error;
      toast.success('Documents KYC Niveau 1 soumis avec succès');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLevel2 = async () => {
    if (!orgDocUrl) { toast.error("Veuillez uploader le document de l'organisation"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await db.rpc('submit_org_kyc', {
        _org_id: orgId,
        _kyc_level: 2,
        _org_document_url: orgDocUrl,
        _org_document_type: orgDocType,
      });
      if (error) throw error;
      toast.success('Documents KYC Niveau 2 soumis avec succès');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Fully approved ──
  if (isLevel2Approved) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold">Vérification complète ✅</p>
              <p className="text-xs text-muted-foreground">
                KYC Niveau 2 approuvé. Retraits illimités activés.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const orgDocTypes = ORG_DOC_TYPES_BY_CATEGORY[orgCategory] || ORG_DOC_TYPES_BY_CATEGORY.other;

  return (
    <div className="space-y-4">
      {/* Category indicator */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
        <Building className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-xs font-medium">Type de plateforme : <span className="text-primary">{CATEGORY_LABELS[orgCategory] || orgCategory}</span></p>
          <p className="text-[10px] text-muted-foreground">Les documents requis sont adaptés à votre type d'organisation.</p>
        </div>
      </div>

      {/* Rejection banner */}
      {isRejected && submission?.rejection_reason && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Vérification refusée</p>
            <p className="text-xs text-muted-foreground">{submission.rejection_reason}</p>
            <p className="text-xs text-muted-foreground mt-1">Vous pouvez corriger et soumettre de nouveaux documents.</p>
          </div>
        </div>
      )}

      {/* Pending banner */}
      {isPending && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/30">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Vérification en cours</p>
            <p className="text-xs text-muted-foreground">
              Vos documents sont en cours d'examen. Délai : 24–48h ouvrées.
            </p>
          </div>
        </div>
      )}

      {/* KYC Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="level1" disabled={isLevel1Approved && !isRejected}>
            <User className="h-3.5 w-3.5 mr-1.5" />
            Niveau 1 — Identité
            {isLevel1Approved && <CheckCircle className="h-3 w-3 ml-1 text-primary" />}
          </TabsTrigger>
          <TabsTrigger value="level2" disabled={!isLevel1Approved && kycStatus !== 'rejected'}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Niveau 2 — Organisation
            {isLevel2Approved && <CheckCircle className="h-3 w-3 ml-1 text-primary" />}
          </TabsTrigger>
        </TabsList>

        {/* ── LEVEL 1 ── */}
        <TabsContent value="level1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-primary" />
                Vérification d'identité
              </CardTitle>
              <CardDescription className="text-xs">
                {CATEGORY_LEVEL1_HINTS[orgCategory] || CATEGORY_LEVEL1_HINTS.other}
                {' '}Plafond de retrait : 1 000 000 XOF/mois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ID Document Type */}
              <div>
                <Label>Type de pièce d'identité *</Label>
                <Select value={idDocType} onValueChange={setIdDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ID_DOC_TYPES.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ID Document Capture */}
              <div>
                <Label>Pièce d'identité (recto/verso) *</Label>
                <CameraCapture
                  value={idDocUrl}
                  onChange={setIdDocUrl}
                  folder={`org/${orgId}/identity`}
                  bucket="kyc-documents"
                  label="Document d'identité"
                  hint="Prenez une photo claire de votre pièce d'identité (recto puis verso)"
                />
              </div>

              {/* Selfie Capture */}
              <div>
                <Label>Photo selfie (recommandé)</Label>
                <CameraCapture
                  value={selfieUrl}
                  onChange={setSelfieUrl}
                  folder={`org/${orgId}/selfie`}
                  bucket="kyc-documents"
                  label="Selfie avec pièce d'identité"
                  hint="Prenez un selfie en tenant votre pièce d'identité visible à côté de votre visage"
                />
              </div>

              {/* Bank details */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">Coordonnées bancaires / Mobile Money</Label>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Requis pour recevoir vos versements. Ces informations seront verrouillées après le premier paiement.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Nom de la banque / Opérateur *</Label>
                    <Input
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="Ex: Ecobank, MTN Mobile Money, Wave..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nom du titulaire *</Label>
                    <Input
                      value={bankAccountName}
                      onChange={e => setBankAccountName(e.target.value)}
                      placeholder="Nom complet tel qu'il apparaît sur le compte"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Numéro de compte / Téléphone Mobile Money *</Label>
                    <Input
                      value={bankAccountNumber}
                      onChange={e => setBankAccountNumber(e.target.value)}
                      placeholder="Numéro de compte bancaire ou numéro Mobile Money"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmitLevel1}
                disabled={submitting || !idDocUrl || isPending || isLevel1Approved}
                className="w-full"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {isPending ? '⏳ En cours de vérification…' : isLevel1Approved ? '✅ Niveau 1 approuvé' : 'Soumettre Niveau 1'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LEVEL 2 ── */}
        <TabsContent value="level2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-5 w-5 text-primary" />
                Documents de l'organisation
              </CardTitle>
              <CardDescription className="text-xs">
                {CATEGORY_LEVEL2_HINTS[orgCategory] || CATEGORY_LEVEL2_HINTS.other}
                {' '}Lève tous les plafonds de retrait.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isLevel1Approved && kycStatus !== 'rejected' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/60 border border-border">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Vous devez d'abord compléter et faire approuver le Niveau 1 avant de soumettre le Niveau 2.
                  </p>
                </div>
              )}

              {/* Org Document Type */}
              <div>
                <Label>Type de document *</Label>
                <Select value={orgDocType} onValueChange={setOrgDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {orgDocTypes.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Org Document Upload */}
              <div>
                <Label>Document officiel *</Label>
                <FileUploader
                  value={orgDocUrl}
                  onChange={setOrgDocUrl}
                  folder={`org/${orgId}/org-docs`}
                  bucket="kyc-documents"
                  accept="image/*,.pdf"
                  label="Document de l'organisation"
                  hint="Récépissé, certificat, statuts ou autorisation officielle (PDF ou image)"
                  hideUrlMode
                />
              </div>

              <Button
                onClick={handleSubmitLevel2}
                disabled={submitting || !orgDocUrl || isPending || (!isLevel1Approved && kycStatus !== 'rejected')}
                className="w-full"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {isPending ? '⏳ En cours de vérification…' : 'Soumettre Niveau 2'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info footer */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium">🔒 Vos documents sont chiffrés et sécurisés</p>
            <p className="text-[10px] text-muted-foreground">
              Stockés de manière sécurisée et accessibles uniquement par les administrateurs autorisés.
              Conformément à notre politique de confidentialité et aux réglementations en vigueur (BCEAO/CENTIF).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

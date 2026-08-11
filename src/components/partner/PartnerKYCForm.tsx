import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/ui/FileUploader';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { Loader2, Shield, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  partnerId: string;
  kycStatus: string;
  rejectionReason?: string | null;
}

export default function PartnerKYCForm({ partnerId, kycStatus, rejectionReason }: Props) {
  const [docType, setDocType] = useState('national_id');
  const [docUrl, setDocUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const DOC_TYPES = [
    { value: 'national_id', label: isFr ? 'Carte Nationale d\'Identité' : 'National ID Card' },
    { value: 'passport', label: isFr ? 'Passeport' : 'Passport' },
    { value: 'drivers_license', label: isFr ? 'Permis de conduire' : 'Driver\'s License' },
  ];

  const handleSubmit = async () => {
    if (!docUrl) { toast.error(isFr ? 'Veuillez uploader votre pièce d\'identité' : 'Please upload your ID document'); return; }
    setSubmitting(true);
    try {
      const { data, error } = await db.rpc('submit_partner_kyc', {
        _partner_id: partnerId,
        _id_document_url: docUrl,
        _id_document_type: docType,
        _selfie_url: selfieUrl || null,
      });
      if (error) throw error;
      toast.success(isFr ? 'Documents KYC soumis avec succès' : 'KYC documents submitted successfully');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (kycStatus === 'approved') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold">{isFr ? 'Identité vérifiée' : 'Identity verified'}</p>
              <p className="text-xs text-muted-foreground">{isFr ? 'Votre vérification KYC a été approuvée.' : 'Your KYC verification has been approved.'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (kycStatus === 'pending') {
    return (
      <Card className="border-secondary/30 bg-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-bold">{isFr ? 'Vérification en cours' : 'Verification in progress'}</p>
              <p className="text-xs text-muted-foreground">{isFr ? 'Vos documents sont en cours d\'examen. Délai : 2–3 jours ouvrés.' : 'Your documents are being reviewed. Timeline: 2–3 business days.'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {isFr ? 'Vérification d\'identité (KYC)' : 'Identity Verification (KYC)'}
        </CardTitle>
        <CardDescription>
          {isFr ? 'Requis avant votre premier paiement. Vos documents sont chiffrés et stockés de manière sécurisée.' : 'Required before your first payout. Your documents are encrypted and securely stored.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {kycStatus === 'rejected' && rejectionReason && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">{isFr ? 'Vérification refusée' : 'Verification rejected'}</p>
              <p className="text-xs text-muted-foreground">{rejectionReason}</p>
              <p className="text-xs text-muted-foreground mt-1">{isFr ? 'Vous pouvez soumettre de nouveaux documents.' : 'You can submit new documents.'}</p>
            </div>
          </div>
        )}

        <div>
          <Label>{isFr ? 'Type de document' : 'Document type'}</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{isFr ? 'Pièce d\'identité (recto/verso)' : 'ID document (front/back)'} *</Label>
          <FileUploader
            value={docUrl}
            onChange={setDocUrl}
            folder={`partner/${partnerId}`}
            bucket="kyc-documents"
            accept="image/*,.pdf"
            label={isFr ? 'Document d\'identité' : 'ID document'}
            hint={isFr ? 'Carte d\'identité, passeport ou permis de conduire (PDF ou image)' : 'National ID, passport or driver\'s license (PDF or image)'}
          />
        </div>

        <div>
          <Label>{isFr ? 'Photo selfie (optionnel)' : 'Selfie photo (optional)'}</Label>
          <FileUploader
            value={selfieUrl}
            onChange={setSelfieUrl}
            folder={`partner/${partnerId}/selfie`}
            bucket="kyc-documents"
            accept="image/*"
            label="Selfie"
            hint={isFr ? 'Photo récente tenant votre pièce d\'identité' : 'Recent photo holding your ID document'}
          />
        </div>

        <Button onClick={handleSubmit} disabled={submitting || !docUrl} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {isFr ? 'Soumettre les documents' : 'Submit documents'}
        </Button>
      </CardContent>
    </Card>
  );
}

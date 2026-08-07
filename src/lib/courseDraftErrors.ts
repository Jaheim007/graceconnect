/**
 * Human-readable messages for the document → course pipeline's coded errors
 * (size/cost caps, unreadable files, unsupported formats).
 */
export function draftErrorMessage(err: any, isFr: boolean): string {
  const code = String(err?.message || err?.detail?.error || '');
  const maxWords = err?.detail?.max_words ?? 30000;

  switch (code) {
    case 'DOCUMENT_TOO_LONG':
      return isFr
        ? `Document trop long (${err?.detail?.words ?? '?'} mots). Limite : ${maxWords} mots — découpez-le en plusieurs fichiers.`
        : `Document too long (${err?.detail?.words ?? '?'} words). Limit: ${maxWords} words — split it into several files.`;
    case 'FILE_TOO_LARGE':
      return isFr ? 'Fichier trop volumineux (max 25 Mo).' : 'File too large (25 MB max).';
    case 'UNSUPPORTED_FORMAT':
      return isFr
        ? 'Format non supporté. Utilisez PDF, Word ou PowerPoint.'
        : 'Unsupported format. Use PDF, Word, or PowerPoint.';
    case 'NO_TEXT_FOUND':
      return isFr
        ? 'Aucun texte lisible trouvé. Si le document est scanné, utilisez une version avec texte sélectionnable.'
        : 'No readable text found. If the document is scanned, use a version with selectable text.';
    case 'DOCX_UNREADABLE':
    case 'PPTX_UNREADABLE':
    case 'EXTRACTION_FAILED':
      return isFr
        ? 'Impossible de lire ce document. Réenregistrez-le au format PDF puis réessayez.'
        : 'Could not read this document. Re-save it as PDF and try again.';
    case 'SESSION_EXPIRED':
      return isFr ? 'Session expirée. Reconnectez-vous puis réessayez.' : 'Session expired. Please log in again and retry.';
    default:
      return code || (isFr ? 'Erreur inconnue' : 'Unknown error');
  }
}

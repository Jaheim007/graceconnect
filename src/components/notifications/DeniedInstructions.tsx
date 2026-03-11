import { AlertTriangle, Monitor, Smartphone } from 'lucide-react';

export function DeniedInstructions() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isChrome = /CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);

  let steps: string[] = [];
  let deviceLabel = '';

  if (isIOS && isSafari) {
    deviceLabel = '📱 iPhone / iPad (Safari)';
    steps = [
      'Ouvrez l\'app Réglages de votre iPhone',
      'Faites défiler vers le bas et appuyez sur Safari',
      'Appuyez sur Notifications',
      'Trouvez ce site et activez « Autoriser »',
      'Revenez ici et appuyez sur « Activer »',
    ];
  } else if (isIOS) {
    deviceLabel = '📱 iPhone / iPad';
    steps = [
      'Ouvrez l\'app Réglages de votre iPhone',
      'Appuyez sur Notifications',
      'Trouvez votre navigateur dans la liste',
      'Activez « Autoriser les notifications »',
      'Revenez ici et appuyez sur « Activer »',
    ];
  } else if (isAndroid && isChrome) {
    deviceLabel = '📱 Android (Chrome)';
    steps = [
      'Appuyez sur le cadenas 🔒 à gauche de l\'adresse du site',
      'Appuyez sur « Autorisations »',
      'À côté de Notifications, choisissez « Autoriser »',
      'Rechargez la page et appuyez sur « Activer »',
    ];
  } else if (isChrome) {
    deviceLabel = '💻 Chrome (ordinateur)';
    steps = [
      'Cliquez sur le cadenas 🔒 à gauche de l\'adresse',
      'Cliquez sur « Paramètres du site »',
      'À côté de Notifications, choisissez « Autoriser »',
      'Rechargez la page et cliquez sur « Activer »',
    ];
  } else if (isFirefox) {
    deviceLabel = '🦊 Firefox';
    steps = [
      'Cliquez sur l\'icône 🔒 à gauche de l\'adresse',
      'Cliquez sur « Permissions »',
      'Cochez « Autoriser les notifications »',
      'Rechargez la page',
    ];
  } else if (isSafari) {
    deviceLabel = '🧭 Safari (Mac)';
    steps = [
      'Allez dans Safari → Réglages',
      'Cliquez sur l\'onglet « Sites web »',
      'Sélectionnez « Notifications » à gauche',
      'Trouvez ce site et choisissez « Autoriser »',
      'Rechargez la page',
    ];
  } else {
    deviceLabel = '🌐 Votre navigateur';
    steps = [
      'Cliquez sur l\'icône cadenas 🔒 à gauche de l\'adresse',
      'Cherchez « Notifications » dans les permissions',
      'Choisissez « Autoriser »',
      'Rechargez la page et cliquez sur « Activer »',
    ];
  }

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-xs font-semibold text-destructive">Notifications bloquées par votre navigateur</p>
      </div>
      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
        {(isIOS || isAndroid) ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
        {deviceLabel}
      </p>
      <ol className="space-y-1.5 pl-1">
        {steps.map((step, i) => (
          <li key={i} className="text-xs text-foreground flex items-start gap-2">
            <span className="shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

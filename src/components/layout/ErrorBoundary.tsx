import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);

    // Auto-reload on chunk / module load errors (stale service worker)
    const msg = error?.message || '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk') ||
      msg.includes('does not exist') // catches DB column mismatch from old code
    ) {
      const key = 'sv_eb_reload';
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      // Only auto-reload once every 30 seconds to avoid loops
      if (!last || now - Number(last) > 30_000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
        return;
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60dvh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-bold">Quelque chose s'est mal passé</h2>
            <p className="text-sm text-muted-foreground">
              Une erreur inattendue est survenue. Essayez de recharger la page.
            </p>
            {this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground max-w-full overflow-auto">
                <summary className="cursor-pointer font-medium text-foreground">Détails de l'erreur</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-1" /> Réessayer
              </Button>
              <Button size="sm" onClick={() => window.location.reload()}>
                Recharger
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

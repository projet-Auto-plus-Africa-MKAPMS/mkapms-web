import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  name: string;
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

// Isolation des univers : un univers qui plante n'affecte JAMAIS les autres.
// (« si Vente a un problème, Location continue de fonctionner »).
export default class UniversBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[univers:${this.props.name}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-page py-20 text-center">
          <h1 className="text-xl font-extrabold text-slate-900">
            L'univers « {this.props.name} » est momentanément indisponible.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Les autres univers restent accessibles. Réessayez ou revenez à l'accueil.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="btn-outline" onClick={() => this.setState({ hasError: false })}>
              Réessayer
            </button>
            <Link to="/" className="btn-primary">Retour à l'accueil</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

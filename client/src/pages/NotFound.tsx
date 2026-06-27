import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <div className="text-6xl font-extrabold text-gold-dark">404</div>
      <p className="mt-3 text-slate-500">Cette page n'existe pas.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Retour à l'accueil</Link>
    </div>
  );
}

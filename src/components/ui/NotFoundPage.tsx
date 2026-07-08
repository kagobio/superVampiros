import { Link } from 'react-router-dom';
import { Ghost } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function NotFoundPage() {
  return (
    <div className="space-y-4">
      <PagePlaceholder
        icon={Ghost}
        title="Página no encontrada"
        description="Esta ruta no existe o aún no está disponible."
        phase="404"
      />
      <div className="text-center">
        <Link to="/" className="text-sm text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

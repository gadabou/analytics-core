import { PageWrapper } from '@components/layout';
import { Card, CardBody, Button } from '@components/ui';
import { ShieldPlus } from 'lucide-react';

export default function RolesPage() {
  return (
    <PageWrapper
      title="Gestion des rôles"
      subtitle="Définir les permissions et accès"
      actions={
        <Button leftIcon={<ShieldPlus size={18} />}>
          Nouveau rôle
        </Button>
      }
    >
      <Card>
        <CardBody>
          <p>Liste des rôles à implémenter...</p>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}

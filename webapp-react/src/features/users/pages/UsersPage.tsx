import { PageWrapper } from '@components/layout';
import { Card, CardBody, Button } from '@components/ui';
import { UserPlus } from 'lucide-react';

export default function UsersPage() {
  return (
    <PageWrapper
      title="Gestion des utilisateurs"
      subtitle="Liste et gestion des comptes utilisateurs"
      actions={
        <Button leftIcon={<UserPlus size={18} />}>
          Nouvel utilisateur
        </Button>
      }
    >
      <Card>
        <CardBody>
          <p>Liste des utilisateurs à implémenter...</p>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}

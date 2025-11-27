import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function Trends() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Tendências</h1>
          <p className="text-muted-foreground mt-1">Página em desenvolvimento</p>
        </div>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Conteúdo em breve</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

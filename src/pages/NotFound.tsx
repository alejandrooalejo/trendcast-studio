import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <DashboardLayout>
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-display font-bold tracking-tight">404</h1>
          <p className="text-lg text-muted-foreground">
            Oops! Página não encontrada.
          </p>
          <p className="text-sm text-muted-foreground">
            O link pode estar incorreto ou a análise já foi removida.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <Button onClick={() => navigate("/trends")} size="lg">
              Voltar para Análises
            </Button>
            <Button variant="outline" onClick={() => navigate("/results")} size="lg">
              Ver resultados salvos
            </Button>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default NotFound;

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

const analysisResults = [
  {
    id: 1,
    name: "Vestido Linho Terracota",
    category: "Vestido",
    trend: "Cores terrosas em alta",
    demandScore: 92,
    riskLevel: "Baixo",
    trendDirection: "up",
    insights: "Alta correlação com buscas por sustentabilidade",
  },
  {
    id: 2,
    name: "Calça Cargo Verde Oliva",
    category: "Calça",
    trend: "Utilitário casual",
    demandScore: 88,
    riskLevel: "Baixo",
    trendDirection: "up",
    insights: "Tendência forte em redes sociais",
  },
  {
    id: 3,
    name: "Blusa Oversized Branca",
    category: "Blusa",
    trend: "Minimalismo atemporal",
    demandScore: 76,
    riskLevel: "Médio",
    trendDirection: "stable",
    insights: "Demanda estável mas saturada",
  },
  {
    id: 4,
    name: "Jaqueta Sintética Rosa Neon",
    category: "Jaqueta",
    trend: "Cores vibrantes em declínio",
    demandScore: 42,
    riskLevel: "Alto",
    trendDirection: "down",
    insights: "Baixa aceitação em pesquisas de consumidor",
  },
];

export default function Results() {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary"> = {
      Alto: "destructive",
      Médio: "default",
      Baixo: "secondary",
    };
    return variants[risk] || "secondary";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Resultados da Análise</h1>
            <p className="text-muted-foreground mt-1">Análise: Coleção Verão 2024 • 4 produtos</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Gerar Relatório PDF
          </Button>
        </div>

        <div className="grid gap-4">
          {analysisResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-4xl font-display text-muted-foreground">{index + 1}</span>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold font-display">{result.name}</h3>
                            <p className="text-sm text-muted-foreground">{result.category}</p>
                          </div>
                          <Badge variant={getRiskBadge(result.riskLevel)}>
                            Risco {result.riskLevel}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          {getTrendIcon(result.trendDirection)}
                          <span className="text-sm font-medium">{result.trend}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Score de demanda</span>
                            <span className="font-semibold">{result.demandScore}/100</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${
                                result.demandScore >= 80
                                  ? "bg-green-600"
                                  : result.demandScore >= 60
                                  ? "bg-primary"
                                  : "bg-destructive"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${result.demandScore}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Insight: </span>
                            {result.insights}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Resumo da Análise</CardTitle>
              <CardDescription>Visão geral dos resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className="text-3xl font-display font-bold text-green-600 mb-2">2</div>
                  <p className="text-sm text-muted-foreground">Produtos com alta aceitação</p>
                </div>
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className="text-3xl font-display font-bold text-primary mb-2">1</div>
                  <p className="text-sm text-muted-foreground">Produtos com risco médio</p>
                </div>
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className="text-3xl font-display font-bold text-destructive mb-2">1</div>
                  <p className="text-sm text-muted-foreground">Produtos com alto risco</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

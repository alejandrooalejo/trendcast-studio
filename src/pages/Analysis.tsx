import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { motion } from "framer-motion";

const comparisonData = {
  previousCollection: {
    topColors: ["Preto", "Branco", "Azul Marinho"],
    topFabrics: ["Algodão", "Poliéster", "Viscose"],
    avgAcceptance: 72,
  },
  currentTrends: {
    topColors: ["Terracota", "Verde Sage", "Azul Petróleo"],
    topFabrics: ["Linho", "Algodão Orgânico", "Tecidos Reciclados"],
    searchVolume: "+145%",
  },
};

const recommendations = [
  {
    category: "Cores",
    suggestion: "Incorporar tons terrosos e naturais",
    impact: "Alto",
    confidence: 94,
  },
  {
    category: "Modelagens",
    suggestion: "Peças oversized e cortes amplos",
    impact: "Alto",
    confidence: 89,
  },
  {
    category: "Materiais",
    suggestion: "Priorizar sustentabilidade e fibras naturais",
    impact: "Médio",
    confidence: 87,
  },
  {
    category: "Estampas",
    suggestion: "Padrões florais minimalistas",
    impact: "Médio",
    confidence: 82,
  },
];

const riskIndicators = [
  { product: "Jaqueta Sintética Azul", risk: "Alto", acceptance: 42 },
  { product: "Vestido Neon Amarelo", risk: "Alto", acceptance: 38 },
  { product: "Calça Cargo Verde Oliva", risk: "Baixo", acceptance: 88 },
];

export default function Analysis() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Análise Detalhada</h1>
            <p className="text-muted-foreground mt-1">Insights profundos gerados pela IA</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Comparação: Coleção Anterior vs. Tendências Atuais</CardTitle>
              <CardDescription>Análise comparativa baseada em dados de mercado e redes sociais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4 text-muted-foreground">Coleção Anterior</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Cores predominantes</p>
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.previousCollection.topColors.map((color) => (
                          <Badge key={color} variant="secondary">{color}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tecidos mais usados</p>
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.previousCollection.topFabrics.map((fabric) => (
                          <Badge key={fabric} variant="secondary">{fabric}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Taxa de aceitação média</p>
                      <div className="text-2xl font-display font-semibold">{comparisonData.previousCollection.avgAcceptance}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-primary">Tendências Atuais</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Cores em alta</p>
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.currentTrends.topColors.map((color) => (
                          <Badge key={color} className="bg-primary">{color}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Materiais mais buscados</p>
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.currentTrends.topFabrics.map((fabric) => (
                          <Badge key={fabric} className="bg-primary">{fabric}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Volume de busca</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div className="text-2xl font-display font-semibold text-green-600">
                          {comparisonData.currentTrends.searchVolume}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Recomendações Estratégicas</CardTitle>
              <CardDescription>Ações práticas baseadas na análise de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">{rec.category}</Badge>
                          <Badge 
                            variant={rec.impact === "Alto" ? "default" : "secondary"}
                            className={rec.impact === "Alto" ? "bg-primary" : ""}
                          >
                            Impacto {rec.impact}
                          </Badge>
                        </div>
                        <p className="font-medium mb-1">{rec.suggestion}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden max-w-xs">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${rec.confidence}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{rec.confidence}% confiança</span>
                        </div>
                      </div>
                    </div>
                    {index < recommendations.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Indicadores de Risco</CardTitle>
              <CardDescription>Produtos com baixa previsão de aceitação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskIndicators.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.risk === "Alto" ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium">{item.product}</p>
                        <p className="text-sm text-muted-foreground">Aceitação prevista: {item.acceptance}%</p>
                      </div>
                    </div>
                    <Badge variant={item.risk === "Alto" ? "destructive" : "secondary"}>
                      {item.risk}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

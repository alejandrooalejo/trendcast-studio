import { TrendingUp, AlertTriangle, Package, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const demandData = [
  { month: "Jan", demand: 400 },
  { month: "Fev", demand: 300 },
  { month: "Mar", demand: 600 },
  { month: "Abr", demand: 800 },
  { month: "Mai", demand: 700 },
  { month: "Jun", demand: 900 },
];

const trendingColors = [
  { name: "Terracota", hex: "#E07856", confidence: 94 },
  { name: "Verde Sage", hex: "#A4B494", confidence: 89 },
  { name: "Azul Petróleo", hex: "#2C5F72", confidence: 87 },
];

const recentAnalyses = [
  { id: 1, name: "Coleção Verão 2024", date: "Há 2 horas", status: "concluída" },
  { id: 2, name: "Linha Premium Casual", date: "Há 5 horas", status: "concluída" },
  { id: 3, name: "Análise Fast Fashion", date: "Ontem", status: "concluída" },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral das suas análises e tendências</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar Nova Análise
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Análises este mês"
            value="24"
            icon={Package}
            trend={{ value: 12, isPositive: true }}
            delay={0}
          />
          <StatCard
            title="Tendências identificadas"
            value="8"
            icon={TrendingUp}
            trend={{ value: 33, isPositive: true }}
            delay={0.1}
          />
          <StatCard
            title="Produtos em risco"
            value="3"
            icon={AlertTriangle}
            description="Baixa aceitação prevista"
            delay={0.2}
          />
          <StatCard
            title="Precisão média"
            value="91%"
            icon={Sparkles}
            trend={{ value: 2, isPositive: true }}
            delay={0.3}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Tendências Emergentes</CardTitle>
                <CardDescription>Cores mais buscadas e mencionadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingColors.map((color, index) => (
                  <div key={color.name} className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg shadow-sm" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{color.name}</span>
                        <Badge variant="secondary">{color.confidence}% confiança</Badge>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${color.confidence}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Projeção de Demanda</CardTitle>
                <CardDescription>Próximos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={demandData}>
                    <defs>
                      <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="demand" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#colorDemand)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Últimas Análises</CardTitle>
              <CardDescription>Histórico de análises geradas pela IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <div 
                    key={analysis.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{analysis.name}</p>
                        <p className="text-sm text-muted-foreground">{analysis.date}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Concluída</Badge>
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

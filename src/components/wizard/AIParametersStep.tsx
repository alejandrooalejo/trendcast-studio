import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Palette, Shirt, Ruler } from "lucide-react";
import { AnalysisData } from "./NewAnalysisWizard";

interface AIParametersStepProps {
  data: AnalysisData;
  onUpdate: (data: Partial<AnalysisData>) => void;
}

const ANALYSIS_DEPTHS = [
  {
    value: "quick",
    label: "Análise Rápida",
    description: "Insights básicos em poucos minutos",
    icon: Sparkles,
  },
  {
    value: "standard",
    label: "Análise Standard",
    description: "Balanceada entre velocidade e profundidade",
    icon: Sparkles,
  },
  {
    value: "deep",
    label: "Análise Profunda",
    description: "Máxima precisão com análise detalhada",
    icon: Sparkles,
  },
];

export function AIParametersStep({ data, onUpdate }: AIParametersStepProps) {
  const updateParameter = (key: string, value: boolean | string) => {
    onUpdate({
      parameters: {
        ...data.parameters,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-medium mb-4">
          Parâmetros da Análise IA
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure o foco e a profundidade da análise de inteligência artificial.
        </p>
      </div>

      {/* Focus Areas */}
      <div className="space-y-4">
        <Label className="text-base">Focos da Análise</Label>
        <p className="text-sm text-muted-foreground">
          Selecione em quais aspectos a IA deve focar
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="focus-colors" className="text-sm font-medium">
                  Análise de Cores
                </Label>
                <p className="text-xs text-muted-foreground">
                  Tendências cromáticas e combinações
                </p>
              </div>
            </div>
            <Switch
              id="focus-colors"
              checked={data.parameters.focusColors}
              onCheckedChange={(checked) => updateParameter("focusColors", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shirt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="focus-fabrics" className="text-sm font-medium">
                  Análise de Tecidos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Materiais mais buscados e valorizados
                </p>
              </div>
            </div>
            <Switch
              id="focus-fabrics"
              checked={data.parameters.focusFabrics}
              onCheckedChange={(checked) => updateParameter("focusFabrics", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ruler className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="focus-models" className="text-sm font-medium">
                  Análise de Modelagens
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cortes, silhuetas e estilos em alta
                </p>
              </div>
            </div>
            <Switch
              id="focus-models"
              checked={data.parameters.focusModels}
              onCheckedChange={(checked) => updateParameter("focusModels", checked)}
            />
          </div>
        </div>
      </div>

      {/* Analysis Depth */}
      <div className="space-y-3">
        <Label className="text-base">Profundidade da Análise</Label>
        <RadioGroup
          value={data.parameters.analysisDepth}
          onValueChange={(value) => updateParameter("analysisDepth", value)}
          className="grid gap-3"
        >
          {ANALYSIS_DEPTHS.map((depth) => {
            const Icon = depth.icon;
            return (
              <div key={depth.value}>
                <RadioGroupItem
                  value={depth.value}
                  id={depth.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={depth.value}
                  className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{depth.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {depth.description}
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Pronto para gerar análise!</p>
            <p className="text-muted-foreground">
              A IA analisará {data.products.length} produto(s) focando em{" "}
              {[
                data.parameters.focusColors && "cores",
                data.parameters.focusFabrics && "tecidos",
                data.parameters.focusModels && "modelagens",
              ]
                .filter(Boolean)
                .join(", ")}{" "}
              com profundidade {data.parameters.analysisDepth}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

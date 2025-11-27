import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AnalysisData } from "./NewAnalysisWizard";

interface CollectionTypeStepProps {
  data: AnalysisData;
  onUpdate: (data: Partial<AnalysisData>) => void;
}

const COLLECTION_TYPES = [
  { value: "summer", label: "Verão", description: "Coleção leve e colorida" },
  { value: "winter", label: "Inverno", description: "Peças mais pesadas e escuras" },
  { value: "premium", label: "Premium", description: "Linha de luxo e alta qualidade" },
  { value: "casual", label: "Casual", description: "Peças do dia a dia" },
  { value: "fast-fashion", label: "Fast Fashion", description: "Tendências rápidas e acessíveis" },
  { value: "athleisure", label: "Athleisure", description: "Esportivo e confortável" },
];

export function CollectionTypeStep({ data, onUpdate }: CollectionTypeStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-medium mb-4">
          Identifique sua Coleção
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Dê um nome à sua coleção e selecione o tipo para uma análise mais precisa.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="collection-name">Nome da Coleção</Label>
        <Input
          id="collection-name"
          placeholder="Ex: Coleção Verão 2024"
          value={data.collectionName}
          onChange={(e) => onUpdate({ collectionName: e.target.value })}
          className="text-base"
        />
      </div>

      <div className="space-y-3">
        <Label>Tipo de Coleção</Label>
        <RadioGroup
          value={data.collectionType}
          onValueChange={(value) => onUpdate({ collectionType: value })}
          className="grid gap-3"
        >
          {COLLECTION_TYPES.map((type) => (
            <div key={type.value}>
              <RadioGroupItem
                value={type.value}
                id={type.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={type.value}
                className="flex items-start gap-4 p-4 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <div className="flex-1">
                  <div className="font-medium mb-1">{type.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {type.description}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

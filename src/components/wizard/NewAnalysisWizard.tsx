import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CollectionTypeStep } from "./CollectionTypeStep";
import { ProductUploadStep } from "./ProductUploadStep";
import { AIParametersStep } from "./AIParametersStep";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewAnalysisWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface AnalysisData {
  collectionName: string;
  collectionType: string;
  products: Array<{
    id: string;
    file: File;
    preview: string;
    category: string;
    fabric: string;
    color: string;
    sku: string;
  }>;
  parameters: {
    focusColors: boolean;
    focusFabrics: boolean;
    focusModels: boolean;
    analysisDepth: string;
  };
}

const STEPS = [
  { id: 1, title: "Tipo de Coleção", description: "Identifique sua coleção" },
  { id: 2, title: "Produtos", description: "Upload de produtos" },
  { id: 3, title: "Parâmetros IA", description: "Configure a análise" },
];

export function NewAnalysisWizard({ open, onOpenChange }: NewAnalysisWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    collectionName: "",
    collectionType: "",
    products: [],
    parameters: {
      focusColors: true,
      focusFabrics: true,
      focusModels: true,
      analysisDepth: "standard",
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    console.log("Análise iniciada:", analysisData);
    // Aqui você pode integrar com backend/navegação para resultados
    onOpenChange(false);
    setCurrentStep(1);
  };

  const updateAnalysisData = (data: Partial<AnalysisData>) => {
    setAnalysisData({ ...analysisData, ...data });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return analysisData.collectionName && analysisData.collectionType;
      case 2:
        return analysisData.products.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Gerar Nova Análise
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  currentStep === step.id
                    ? "text-primary font-medium"
                    : currentStep > step.id
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <div className="font-medium">{step.title}</div>
                <div className="text-xs">{step.description}</div>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <CollectionTypeStep
                  data={analysisData}
                  onUpdate={updateAnalysisData}
                />
              )}
              {currentStep === 2 && (
                <ProductUploadStep
                  data={analysisData}
                  onUpdate={updateAnalysisData}
                />
              )}
              {currentStep === 3 && (
                <AIParametersStep
                  data={analysisData}
                  onUpdate={updateAnalysisData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="text-sm text-muted-foreground">
            Passo {currentStep} de {STEPS.length}
          </div>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!canProceed()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Análise
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

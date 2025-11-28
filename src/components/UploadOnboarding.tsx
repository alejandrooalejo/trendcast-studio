import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Upload, FileText, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <CheckCircle2 className="h-10 w-10 text-primary" />,
    title: "Selecione uma Análise",
    description: "Escolha uma análise de tendências para comparar seus produtos com o mercado atual."
  },
  {
    icon: <Upload className="h-10 w-10 text-primary" />,
    title: "Faça Upload das Imagens",
    description: "Arraste e solte suas fotos de produtos ou clique para selecionar. Suporte para PNG, JPG até 10MB."
  },
  {
    icon: <FileText className="h-10 w-10 text-primary" />,
    title: "Preencha os Dados",
    description: "Adicione categoria e SKU de cada produto para melhor organização e rastreamento."
  },
  {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    title: "Analise e Compare",
    description: "Clique em 'Analisar' para descobrir o potencial de demanda e alinhamento com tendências."
  }
];

export function UploadOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('upload-onboarding-seen');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('upload-onboarding-seen', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Como Usar</DialogTitle>
          <DialogDescription>
            Aprenda em 4 passos simples
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center mb-4">
                {steps[currentStep].icon}
              </div>
              <h3 className="text-xl font-semibold">
                {steps[currentStep].title}
              </h3>
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted hover:bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-muted-foreground"
          >
            Pular
          </Button>

          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? (
              'Começar'
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

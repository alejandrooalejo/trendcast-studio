import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone, MapPin, Shirt, Users, Bell, Shield, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  
  const [companyData, setCompanyData] = useState({
    name: "Minha Confecção LTDA",
    cnpj: "12.345.678/0001-90",
    email: "contato@minhaconfeccao.com.br",
    phone: "(11) 99999-9999",
    address: "Rua das Confecções, 123 - Centro",
    city: "São Paulo",
    state: "SP",
    segment: "feminino",
    employeeCount: "11-50",
    description: "Confecção especializada em moda feminina casual e social.",
  });

  const [notifications, setNotifications] = useState({
    emailAnalysis: true,
    emailTrends: true,
    emailWeekly: false,
    pushNotifications: true,
  });

  const [preferences, setPreferences] = useState({
    autoAnalysis: true,
    saveHistory: true,
    publicProfile: false,
  });

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie as configurações da sua empresa</p>
        </div>

        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informações básicas da sua confecção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social</Label>
                <Input
                  id="name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={companyData.cnpj}
                  onChange={(e) => setCompanyData({ ...companyData, cnpj: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                id="address"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={companyData.city}
                  onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={companyData.state}
                  onValueChange={(value) => setCompanyData({ ...companyData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">Acre</SelectItem>
                    <SelectItem value="AL">Alagoas</SelectItem>
                    <SelectItem value="AP">Amapá</SelectItem>
                    <SelectItem value="AM">Amazonas</SelectItem>
                    <SelectItem value="BA">Bahia</SelectItem>
                    <SelectItem value="CE">Ceará</SelectItem>
                    <SelectItem value="DF">Distrito Federal</SelectItem>
                    <SelectItem value="ES">Espírito Santo</SelectItem>
                    <SelectItem value="GO">Goiás</SelectItem>
                    <SelectItem value="MA">Maranhão</SelectItem>
                    <SelectItem value="MT">Mato Grosso</SelectItem>
                    <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="PA">Pará</SelectItem>
                    <SelectItem value="PB">Paraíba</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
                    <SelectItem value="PE">Pernambuco</SelectItem>
                    <SelectItem value="PI">Piauí</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="RO">Rondônia</SelectItem>
                    <SelectItem value="RR">Roraima</SelectItem>
                    <SelectItem value="SC">Santa Catarina</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="SE">Sergipe</SelectItem>
                    <SelectItem value="TO">Tocantins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segmento e Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-primary" />
              Segmento de Atuação
            </CardTitle>
            <CardDescription>
              Defina o perfil da sua confecção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Segmento Principal</Label>
                <Select
                  value={companyData.segment}
                  onValueChange={(value) => setCompanyData({ ...companyData, segment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feminino">Moda Feminina</SelectItem>
                    <SelectItem value="masculino">Moda Masculina</SelectItem>
                    <SelectItem value="infantil">Moda Infantil</SelectItem>
                    <SelectItem value="praia">Moda Praia</SelectItem>
                    <SelectItem value="fitness">Moda Fitness</SelectItem>
                    <SelectItem value="jeans">Jeanswear</SelectItem>
                    <SelectItem value="uniformes">Uniformes</SelectItem>
                    <SelectItem value="intima">Moda Íntima</SelectItem>
                    <SelectItem value="plus-size">Plus Size</SelectItem>
                    <SelectItem value="casual">Casual Wear</SelectItem>
                    <SelectItem value="social">Moda Social</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Número de Funcionários
                </Label>
                <Select
                  value={companyData.employeeCount}
                  onValueChange={(value) => setCompanyData({ ...companyData, employeeCount: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1 a 10 funcionários</SelectItem>
                    <SelectItem value="11-50">11 a 50 funcionários</SelectItem>
                    <SelectItem value="51-100">51 a 100 funcionários</SelectItem>
                    <SelectItem value="101-500">101 a 500 funcionários</SelectItem>
                    <SelectItem value="500+">Mais de 500 funcionários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Empresa</Label>
              <Textarea
                id="description"
                value={companyData.description}
                onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                rows={3}
                placeholder="Descreva brevemente sua confecção..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como deseja receber atualizações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Análises Concluídas</Label>
                <p className="text-sm text-muted-foreground">
                  Receber e-mail quando uma análise for concluída
                </p>
              </div>
              <Switch
                checked={notifications.emailAnalysis}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailAnalysis: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Novas Tendências</Label>
                <p className="text-sm text-muted-foreground">
                  Alertas sobre novas tendências identificadas
                </p>
              </div>
              <Switch
                checked={notifications.emailTrends}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailTrends: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Relatório Semanal</Label>
                <p className="text-sm text-muted-foreground">
                  Resumo semanal das suas análises e insights
                </p>
              </div>
              <Switch
                checked={notifications.emailWeekly}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailWeekly: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações no navegador
                </p>
              </div>
              <Switch
                checked={notifications.pushNotifications}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, pushNotifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Preferências do Sistema
            </CardTitle>
            <CardDescription>
              Configurações avançadas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Análise Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Iniciar análise automaticamente após upload
                </p>
              </div>
              <Switch
                checked={preferences.autoAnalysis}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, autoAnalysis: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Salvar Histórico</Label>
                <p className="text-sm text-muted-foreground">
                  Manter histórico de todas as análises realizadas
                </p>
              </div>
              <Switch
                checked={preferences.saveHistory}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, saveHistory: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Perfil Público</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que outras empresas vejam seu perfil
                </p>
              </div>
              <Switch
                checked={preferences.publicProfile}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, publicProfile: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

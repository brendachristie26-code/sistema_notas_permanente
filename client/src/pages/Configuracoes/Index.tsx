import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Upload, Save } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { data: config } = trpc.configuracoes.get.useQuery();
  const updateMutation = trpc.configuracoes.update.useMutation();
  const uploadLogoMutation = trpc.storage.uploadLogo.useMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nomeEmpresa: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    website: "",
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        nomeEmpresa: config.nomeEmpresa || "",
        cnpj: config.cnpj || "",
        endereco: config.endereco || "",
        telefone: config.telefone || "",
        email: config.email || "",
        website: config.website || "",
      });
      if (config.logoUrl) {
        setLogoPreview(config.logoUrl);
        setLogoUrl(config.logoUrl);
      }
    }
  }, [config]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Content = (event.target?.result as string).split(',')[1];
        if (!base64Content) return;
        
        try {
          const result = await uploadLogoMutation.mutateAsync({
            fileName: file.name,
            imageContent: base64Content,
          });
          
          setLogoPreview(result.url);
          setLogoUrl(result.url);
          toast.success("Logo carregado com sucesso!");
        } catch (error) {
          console.error("Erro ao fazer upload do logo:", error);
          toast.error("Erro ao fazer upload do logo");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        ...formData,
        logoUrl: logoUrl || undefined,
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações da Empresa</h1>
          <p className="text-gray-600 mt-2">Gerencie os dados da sua empresa e logo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-32 mx-auto object-contain"
                    />
                    <p className="text-sm text-gray-600">Logo carregado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">Nenhum logo carregado</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || uploadLogoMutation.isPending}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading || uploadLogoMutation.isPending ? "Carregando..." : "Selecionar Logo"}
              </Button>
            </CardContent>
          </Card>

          {/* Dados da Empresa */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
                  <Input
                    name="nomeEmpresa"
                    value={formData.nomeEmpresa}
                    onChange={handleInputChange}
                    placeholder="Sua Empresa LTDA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CNPJ</label>
                  <Input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <Input
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <Input
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endereço</label>
                <Textarea
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                  rows={3}
                />
              </div>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>O logo carregado aqui será exibido nos PDFs de notas fiscais e orçamentos.</p>
            <p>Recomendamos usar uma imagem em PNG com fundo transparente para melhor qualidade.</p>
            <p>Tamanho máximo recomendado: 2MB</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

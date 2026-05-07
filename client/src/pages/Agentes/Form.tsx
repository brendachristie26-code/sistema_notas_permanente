import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function AgentesForm({ params }: { params?: { id?: string } }) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ nome: "", email: "", telefone: "" });
  const createAgente = trpc.agentes.create.useMutation();
  const updateAgente = trpc.agentes.update.useMutation();
  const { data: agente } = trpc.agentes.get.useQuery(
    { id: params?.id ? parseInt(params.id) : 0 },
    { enabled: !!params?.id }
  );

  useEffect(() => {
    if (agente) {
      setFormData({
        nome: agente.nome,
        email: agente.email,
        telefone: agente.telefone || "",
      });
    }
  }, [agente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (params?.id) {
        await updateAgente.mutateAsync({
          id: parseInt(params.id),
          ...formData,
        });
      } else {
        await createAgente.mutateAsync(formData);
      }
      setLocation("/agentes");
    } catch (error) {
      console.error("Erro ao salvar agente:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">
          {params?.id ? "Editar Agente" : "Novo Agente"}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={createAgente.isPending || updateAgente.isPending}>
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/agentes")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

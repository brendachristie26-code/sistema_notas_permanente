import { Building2, Check, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const [, setLocation] = useLocation();
  const { workspaces, activeWorkspaceId, isLoading, setActiveWorkspace } = useWorkspace();

  if (isLoading) return <div className="h-9 animate-pulse rounded-md bg-muted" />;

  if (workspaces.length === 0) {
    return <Button variant="outline" size="sm" onClick={() => setLocation("/equipe")} className="w-full justify-start gap-2"><Plus className="h-4 w-4" />{!compact && "Criar workspace"}</Button>;
  }

  return (
    <Select value={activeWorkspaceId ? String(activeWorkspaceId) : undefined} onValueChange={value => setActiveWorkspace(Number(value))}>
      <SelectTrigger className={compact ? "w-10 px-2" : "w-full"} aria-label="Selecionar workspace">
        <Building2 className="h-4 w-4 shrink-0" />
        {!compact && <SelectValue placeholder="Workspace" />}
      </SelectTrigger>
      <SelectContent>
        {workspaces.map(workspace => (
          <SelectItem key={workspace.id} value={String(workspace.id)}>
            <span className="flex items-center gap-2">{workspace.name}{workspace.id === activeWorkspaceId && <Check className="h-3 w-3" />}</span>
          </SelectItem>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setLocation("/equipe")} className="mt-1 w-full justify-start gap-2"><Plus className="h-4 w-4" /> Criar ou gerenciar</Button>
      </SelectContent>
    </Select>
  );
}

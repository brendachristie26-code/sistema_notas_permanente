import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

const ACTIVE_WORKSPACE_KEY = "active-workspace-id";

type WorkspaceContextValue = {
  activeWorkspaceId: number | null;
  activeWorkspace: { id: number; name: string; slugUrl: string; logoUrl: string | null; role: "OWNER" | "ADMIN" | "USER" } | null;
  workspaces: Array<{ id: number; name: string; slugUrl: string; logoUrl: string | null; role: "OWNER" | "ADMIN" | "USER" }>;
  isLoading: boolean;
  setActiveWorkspace: (workspaceId: number) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const query = trpc.workspace.listMyWorkspaces.useQuery();
  const utils = trpc.useUtils();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null;
    return raw ? Number(raw) : null;
  });

  const workspaces = query.data ?? [];
  const activeWorkspace = useMemo(
    () => workspaces.find(workspace => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null,
    [activeWorkspaceId, workspaces]
  );

  useEffect(() => {
    if (activeWorkspace && activeWorkspace.id !== activeWorkspaceId) {
      setActiveWorkspaceId(activeWorkspace.id);
      window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, String(activeWorkspace.id));
    }
  }, [activeWorkspace, activeWorkspaceId]);

  const setActiveWorkspace = (workspaceId: number) => {
    setActiveWorkspaceId(workspaceId);
    window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, String(workspaceId));
    void utils.invalidate();
  };

  const value = useMemo<WorkspaceContextValue>(() => ({
    activeWorkspaceId: activeWorkspace?.id ?? null,
    activeWorkspace,
    workspaces,
    isLoading: query.isLoading,
    setActiveWorkspace,
  }), [activeWorkspace, query.isLoading, setActiveWorkspace, workspaces]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace deve ser usado dentro de WorkspaceProvider");
  return context;
}

import { create } from "zustand";

type DrawerTab = "overview" | "forecast" | "attribution" | "history" | "interventions";

interface AegisUIState {
  selectedZoneId: number | null;
  drawerOpen: boolean;
  activeTab: DrawerTab;
  workspaceOpen: boolean;

  openZone: (id: number) => void;
  closeDrawer: () => void;
  setTab: (tab: DrawerTab) => void;
  openWorkspace: () => void;
  closeWorkspace: () => void;
}

export const useAegisUI = create<AegisUIState>((set) => ({
  selectedZoneId: null,
  drawerOpen: false,
  activeTab: "overview",
  workspaceOpen: false,

  openZone: (id) => set({ selectedZoneId: id, drawerOpen: true, activeTab: "overview" }),
  closeDrawer: () => set({ drawerOpen: false, workspaceOpen: false }),
  setTab: (tab) => set({ activeTab: tab }),
  openWorkspace: () => set({ workspaceOpen: true }),
  closeWorkspace: () => set({ workspaceOpen: false }),
}));

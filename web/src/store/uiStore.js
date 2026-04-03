import { create } from 'zustand';

export const useUIStore = create((set) => ({
  currentTab: 'builder',
  selectedFieldId: null,
  isConfigPanelOpen: false,

  setTab: (tab) => set({ currentTab: tab }),
  selectField: (id) => set({ selectedFieldId: id, isConfigPanelOpen: true }),
  deselectField: () => set({ selectedFieldId: null, isConfigPanelOpen: false }),
  toggleConfigPanel: () => set((state) => ({ isConfigPanelOpen: !state.isConfigPanelOpen })),
  
  // Collaborative cursors could be managed here or in a separate context
  collaborators: {},
  updateCollaborators: (cursors) => set({ collaborators: cursors }),
}));

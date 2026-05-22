import { create } from 'zustand'
import type {
  AspectRatio,
  CanvasOverlayId,
  LeftPanelTopTab,
  LeftPanelBottomTab,
  LeftPanelTab,
  RightPanelTab,
  TabGroupId,
} from '@/types'
import {
  TAB_TO_GROUP,
  GROUP_DEFAULT_TAB,
  ABSORBED_TAB_REDIRECT,
  TAB_GROUPS,
  CARD_GRID_THRESHOLD,
} from '@/constants/tabGroups'

interface EditorState {
  // Panel state
  leftPanelCollapsed: boolean
  leftPanelTopTab: LeftPanelTopTab
  leftPanelBottomTab: LeftPanelBottomTab
  leftPanelActiveTab: LeftPanelTab // Single active tab
  leftPanelActiveGroup: TabGroupId
  leftPanelGroupMemory: Partial<Record<TabGroupId, LeftPanelTab>>
  rightPanelTab: RightPanelTab

  // Canvas state
  aspectRatio: AspectRatio

  // Character panel filter
  characterDimensionFilter: '2d' | '3d'

  // PixiJS renderer toggle (Phase 1: media layer only)
  usePixiRenderer: boolean
  setUsePixiRenderer: (enabled: boolean) => void
  togglePixiRenderer: () => void

  // Highlighted viseme key (for right panel visual indication when clicking timeline visemes)
  highlightedVisemeKey: string | null
  setHighlightedVisemeKey: (key: string | null) => void

  // Canvas overlay system
  activeCanvasOverlay: CanvasOverlayId | null
  openCanvasOverlay: (id: CanvasOverlayId) => void
  closeCanvasOverlay: () => void
  toggleCanvasOverlay: (id: CanvasOverlayId) => void

  // Card grid navigation for large groups
  showGroupHome: boolean
  setShowGroupHome: (show: boolean) => void

  // Modals
  libraryModalOpen: boolean
  projectsModalOpen: boolean
  settingsModalOpen: boolean
  exportModalOpen: boolean
  recordingsModalOpen: boolean
  shareModalOpen: boolean
  shareRecordingId: string | null
  analyticsModalOpen: boolean
  analyticsRecordingId: string | null
  signInModalOpen: boolean
  insightsModalOpen: boolean
  recommendationsModalOpen: boolean
  shortcutsModalOpen: boolean

  // Dev Mode
  templateDevModeOpen: boolean
  setTemplateDevModeOpen: (open: boolean) => void

  // Actions
  toggleLeftPanel: () => void
  setLeftPanelTopTab: (tab: LeftPanelTopTab) => void
  setLeftPanelBottomTab: (tab: LeftPanelBottomTab) => void
  setLeftPanelActiveTab: (tab: LeftPanelTab) => void
  setLeftPanelGroup: (groupId: TabGroupId) => void
  setRightPanelTab: (tab: RightPanelTab) => void
  setAspectRatio: (ratio: AspectRatio) => void
  setLibraryModalOpen: (open: boolean) => void
  setProjectsModalOpen: (open: boolean) => void
  setSettingsModalOpen: (open: boolean) => void
  setExportModalOpen: (open: boolean) => void
  setRecordingsModalOpen: (open: boolean) => void
  setShareModalOpen: (open: boolean) => void
  setShareRecordingId: (id: string | null) => void
  setAnalyticsModalOpen: (open: boolean) => void
  setAnalyticsRecordingId: (id: string | null) => void
  setSignInModalOpen: (open: boolean) => void
  setInsightsModalOpen: (open: boolean) => void
  setRecommendationsModalOpen: (open: boolean) => void
  setShortcutsModalOpen: (open: boolean) => void
  setCharacterDimensionFilter: (filter: '2d' | '3d') => void
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state
  leftPanelCollapsed: false,
  leftPanelTopTab: 'media',
  leftPanelBottomTab: 'character',
  leftPanelActiveTab: 'character', // Default active tab
  leftPanelActiveGroup: 'character' as TabGroupId,
  leftPanelGroupMemory: {},
  rightPanelTab: 'group-properties',
  aspectRatio: '16:9',
  characterDimensionFilter: '2d',
  usePixiRenderer: false,
  setUsePixiRenderer: (enabled) => set({ usePixiRenderer: enabled }),
  togglePixiRenderer: () => set((s) => ({ usePixiRenderer: !s.usePixiRenderer })),

  showGroupHome: false,
  setShowGroupHome: (show) => set({ showGroupHome: show }),

  highlightedVisemeKey: null,
  activeCanvasOverlay: null,
  openCanvasOverlay: (id) => set({ activeCanvasOverlay: id }),
  closeCanvasOverlay: () => set({ activeCanvasOverlay: null }),
  toggleCanvasOverlay: (id) => set((s) => ({ activeCanvasOverlay: s.activeCanvasOverlay === id ? null : id })),

  libraryModalOpen: false,
  projectsModalOpen: false,
  settingsModalOpen: false,
  exportModalOpen: false,
  recordingsModalOpen: false,
  shareModalOpen: false,
  shareRecordingId: null,
  analyticsModalOpen: false,
  analyticsRecordingId: null,
  signInModalOpen: false,
  insightsModalOpen: false,
  recommendationsModalOpen: false,
  shortcutsModalOpen: false,
  templateDevModeOpen: false,
  setTemplateDevModeOpen: (open) => set({ templateDevModeOpen: open }),

  // Actions
  toggleLeftPanel: () => set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),

  setLeftPanelTopTab: (tab) => {
    // Delegate to setLeftPanelActiveTab for unified group resolution
    const resolvedTab = (ABSORBED_TAB_REDIRECT[tab] ?? tab) as LeftPanelTab
    const group = TAB_TO_GROUP[resolvedTab]
    set((s) => ({
      leftPanelTopTab: tab,
      leftPanelActiveTab: resolvedTab,
      ...(group
        ? {
            leftPanelActiveGroup: group,
            leftPanelGroupMemory: { ...s.leftPanelGroupMemory, [group]: resolvedTab },
          }
        : {}),
    }))
  },

  setLeftPanelBottomTab: (tab) => {
    // Delegate to setLeftPanelActiveTab for unified group resolution
    const resolvedTab = (ABSORBED_TAB_REDIRECT[tab] ?? tab) as LeftPanelTab
    const group = TAB_TO_GROUP[resolvedTab]
    set((s) => ({
      leftPanelBottomTab: tab,
      leftPanelActiveTab: resolvedTab,
      ...(group
        ? {
            leftPanelActiveGroup: group,
            leftPanelGroupMemory: { ...s.leftPanelGroupMemory, [group]: resolvedTab },
          }
        : {}),
    }))
  },

  setLeftPanelActiveTab: (tab) => {
    // 1. Check absorbed tab redirect
    const resolvedTab = (ABSORBED_TAB_REDIRECT[tab] ?? tab) as LeftPanelTab

    // 2. If ai-edit, open overlay instead
    if (resolvedTab === 'ai-edit') {
      set({ activeCanvasOverlay: 'ai-director' })
      return
    }

    // 3. Resolve group and update memory — always drill in (hide card grid)
    const group = TAB_TO_GROUP[resolvedTab]
    set((s) => ({
      leftPanelActiveTab: resolvedTab,
      showGroupHome: false,
      ...(group
        ? {
            leftPanelActiveGroup: group,
            leftPanelGroupMemory: { ...s.leftPanelGroupMemory, [group]: resolvedTab },
            leftPanelCollapsed: false,
          }
        : {}),
    }))
  },

  setLeftPanelGroup: (groupId) => {
    set((s) => {
      const remembered = s.leftPanelGroupMemory[groupId] ?? GROUP_DEFAULT_TAB[groupId]
      const restoredTab = (ABSORBED_TAB_REDIRECT[remembered] ?? remembered) as LeftPanelTab
      const groupDef = TAB_GROUPS.find((g) => g.id === groupId)
      const isLargeGroup = groupDef ? groupDef.subTabs.length > CARD_GRID_THRESHOLD : false
      return {
        leftPanelActiveGroup: groupId,
        leftPanelActiveTab: restoredTab,
        leftPanelCollapsed: false,
        showGroupHome: isLargeGroup,
      }
    })
  },

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

  setLibraryModalOpen: (open) => set({ libraryModalOpen: open }),
  setProjectsModalOpen: (open) => set({ projectsModalOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setRecordingsModalOpen: (open) => set({ recordingsModalOpen: open }),
  setShareModalOpen: (open) => set({ shareModalOpen: open }),
  setShareRecordingId: (id) => set({ shareRecordingId: id }),
  setAnalyticsModalOpen: (open) => set({ analyticsModalOpen: open }),
  setAnalyticsRecordingId: (id) => set({ analyticsRecordingId: id }),
  setSignInModalOpen: (open) => set({ signInModalOpen: open }),
  setInsightsModalOpen: (open) => set({ insightsModalOpen: open }),
  setRecommendationsModalOpen: (open) => set({ recommendationsModalOpen: open }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  setCharacterDimensionFilter: (filter) => set({ characterDimensionFilter: filter }),
  setHighlightedVisemeKey: (key) => set({ highlightedVisemeKey: key }),
}))

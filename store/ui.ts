import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  // Main sidebar state
  sidebarCollapsed: boolean
  sidebarHovered: boolean
  sidebarManuallyToggled: boolean
  
  // Resume editor sidebar state
  editorSidebarCollapsed: boolean
  editorSidebarHovered: boolean
  editorSidebarManuallyToggled: boolean
  
  // Main sidebar actions
  setSidebarCollapsed: (collapsed: boolean, manual?: boolean) => void
  setSidebarHovered: (hovered: boolean) => void
  toggleSidebar: () => void
  autoCollapseSidebar: () => void
  
  // Resume editor sidebar actions
  setEditorSidebarCollapsed: (collapsed: boolean, manual?: boolean) => void
  setEditorSidebarHovered: (hovered: boolean) => void
  toggleEditorSidebar: () => void
  autoCollapseEditorSidebar: () => void
  
  // Computed getters
  getSidebarVisible: () => boolean
  getEditorSidebarVisible: () => boolean
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state - main sidebar
      sidebarCollapsed: false,
      sidebarHovered: false,
      sidebarManuallyToggled: false,
      
      // Initial state - editor sidebar
      editorSidebarCollapsed: true, // Start collapsed for more editing space
      editorSidebarHovered: false,
      editorSidebarManuallyToggled: false,
      
      // Set sidebar collapsed state
      setSidebarCollapsed: (collapsed: boolean, manual = false) => {
        set({ 
          sidebarCollapsed: collapsed,
          sidebarManuallyToggled: manual ? !collapsed : get().sidebarManuallyToggled
        })
      },
      
      // Set hover state
      setSidebarHovered: (hovered: boolean) => {
        set({ sidebarHovered: hovered })
      },
      
      // Manual toggle (user clicked button)
      toggleSidebar: () => {
        const current = get().sidebarCollapsed
        set({ 
          sidebarCollapsed: !current,
          sidebarManuallyToggled: current // If expanding manually, mark as manual
        })
      },
      
      // Auto-collapse (only if not manually toggled to stay expanded)
      autoCollapseSidebar: () => {
        const { sidebarManuallyToggled } = get()
        if (!sidebarManuallyToggled) {
          set({ sidebarCollapsed: true })
        }
      },
      
      // Resume editor sidebar actions
      setEditorSidebarCollapsed: (collapsed: boolean, manual = false) => {
        set({ 
          editorSidebarCollapsed: collapsed,
          editorSidebarManuallyToggled: manual ? !collapsed : get().editorSidebarManuallyToggled
        })
      },
      
      setEditorSidebarHovered: (hovered: boolean) => {
        set({ editorSidebarHovered: hovered })
      },
      
      toggleEditorSidebar: () => {
        const current = get().editorSidebarCollapsed
        set({ 
          editorSidebarCollapsed: !current,
          editorSidebarManuallyToggled: current
        })
      },
      
      autoCollapseEditorSidebar: () => {
        const { editorSidebarManuallyToggled } = get()
        if (!editorSidebarManuallyToggled) {
          set({ editorSidebarCollapsed: true })
        }
      },
      
      // Check if sidebar should be visible (expanded or hovered)
      getSidebarVisible: () => {
        const { sidebarCollapsed, sidebarHovered } = get()
        return !sidebarCollapsed || sidebarHovered
      },
      
      getEditorSidebarVisible: () => {
        const { editorSidebarCollapsed, editorSidebarHovered } = get()
        return !editorSidebarCollapsed || editorSidebarHovered
      }
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => localStorage),
      // Only persist the collapsed state and manual toggle preference
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarManuallyToggled: state.sidebarManuallyToggled,
        editorSidebarCollapsed: state.editorSidebarCollapsed,
        editorSidebarManuallyToggled: state.editorSidebarManuallyToggled
      }),
    }
  )
)
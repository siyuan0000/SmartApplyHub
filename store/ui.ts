import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean
  sidebarHovered: boolean
  sidebarManuallyToggled: boolean
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean, manual?: boolean) => void
  setSidebarHovered: (hovered: boolean) => void
  toggleSidebar: () => void
  autoCollapseSidebar: () => void
  
  // Computed getters
  getSidebarVisible: () => boolean
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarHovered: false,
      sidebarManuallyToggled: false,
      
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
      
      // Check if sidebar should be visible (expanded or hovered)
      getSidebarVisible: () => {
        const { sidebarCollapsed, sidebarHovered } = get()
        return !sidebarCollapsed || sidebarHovered
      }
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => localStorage),
      // Only persist the collapsed state and manual toggle preference
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarManuallyToggled: state.sidebarManuallyToggled
      }),
    }
  )
)
/**
 * VideoCall - Zustand-based state management
 * No Provider needed! Just import and use directly in components.
 * 
 * For initialization, use useVideoCallManager() hook in App root.
 */
import useVideoCallStore from '../../stores/useVideoCallStore';

/**
 * Hook to access video call state and actions
 * Can be used in any component without Provider wrapper
 */
export const useVideoCall = () => {
  return useVideoCallStore();
};

// Legacy export for backward compatibility
export { useVideoCallStore };
export default useVideoCallStore;


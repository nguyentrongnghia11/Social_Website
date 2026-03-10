import useVideoCallStore from '../../stores/useVideoCallStore';


export const useVideoCall = () => {
  return useVideoCallStore();
};

export { useVideoCallStore };
export default useVideoCallStore;


// hooks/useUserAuth.js
import { useSelector } from "react-redux";

const useUserAuth = () => {
  return useSelector((state) => state.auth);
};

export default useUserAuth;


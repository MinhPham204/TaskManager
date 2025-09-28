// hooks/useUserAuth.js
import { useContext } from "react";
import { UserContext } from "../context/userContext";

const useUserAuth = () => {
  return useContext(UserContext);
};

export default useUserAuth;


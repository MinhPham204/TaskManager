import React, {createContext, useContext, useState, useEffect} from "react";

export const UserContext = createContext();
export const useUser = () => useContext(UserContext);



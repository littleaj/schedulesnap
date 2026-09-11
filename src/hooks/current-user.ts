import React, { useContext } from "react";
import { CurrentUserContext } from "@/contexts/current-user";

const useCurrentUser = () => {
  return useContext(CurrentUserContext);
};

export default useCurrentUser;

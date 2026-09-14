import React, { useEffect, useState } from "react";
import { useFirestore } from "./firebase";
import { getUserProfile } from "@/services/user-profile";
import type { UserProfile } from "@/types/user-profile";
import useCurrentUser from "./current-user";

export const useUserProfile = () => {
  const firestore = useFirestore();
  const user = useCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (!user?.uid) return;
    void (async () => {
      const settings = await getUserProfile(firestore, user.uid);
      setProfile(settings);
    })();
  }, [firestore, user?.uid]);

  return profile;
};

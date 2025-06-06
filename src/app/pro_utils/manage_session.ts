"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = sessionStorage.getItem("session");
    
    if (session) {
        const parsedSession = JSON.parse(session);
        if (!parsedSession.is_login) {
        router.push("/");
        }
      
    }else{
        router.push("/");
    }
  }, []);
}



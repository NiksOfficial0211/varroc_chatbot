// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function useSessionRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     const session = sessionStorage.getItem("session");
    
//     if (session) {
//         const parsedSession = JSON.parse(session);
//         if (!parsedSession.is_login) {
//         router.push("/");
//         }
      
//     }else{
//         router.push("/");
//     }
//   }, []);
// }


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem("session");

      if (session) {
        const parsedSession = JSON.parse(session);
        if (!parsedSession.is_login) {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    };

    // Initial check
    checkSession();

    // Listen for changes in localStorage across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "session") {
        checkSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);
}

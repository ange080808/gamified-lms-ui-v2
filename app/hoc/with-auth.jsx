"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login"); // Redirect to login if no token
      } else {
        setIsAuthenticated(true);
      }
    }, []);

    if (!isAuthenticated) return null; // Prevents flickering

    return <Component {...props} />;
  };
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AdminKeyContextValue {
  adminKey: string;
  setAdminKey: (key: string) => void;
  clearKey: () => void;
}

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null);

const STORAGE_KEY = "domalingo_admin_key";

export function AdminKeyProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKeyState] = useState("");

  // Hydrate from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY) ?? "";
    setAdminKeyState(stored);
  }, []);

  const setAdminKey = (key: string) => {
    sessionStorage.setItem(STORAGE_KEY, key);
    setAdminKeyState(key);
  };

  const clearKey = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAdminKeyState("");
  };

  return (
    <AdminKeyContext.Provider value={{ adminKey, setAdminKey, clearKey }}>
      {children}
    </AdminKeyContext.Provider>
  );
}

export function useAdminKey() {
  const ctx = useContext(AdminKeyContext);
  if (!ctx) throw new Error("useAdminKey must be used inside AdminKeyProvider");
  return ctx;
}

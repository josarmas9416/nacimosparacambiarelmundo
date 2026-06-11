"use client";

import { createContext, useContext } from "react";

interface AdminContextValue {
  token: string;
}

export const AdminContext = createContext<AdminContextValue>({ token: "" });

export function useAdmin() {
  return useContext(AdminContext);
}

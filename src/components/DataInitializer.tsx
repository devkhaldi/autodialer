"use client";

import { useEffect } from "react";
import { useLeadStore } from "@/store/leadStore";

export function DataInitializer() {
  const { fetchLeads } = useLeadStore();

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return null;
}

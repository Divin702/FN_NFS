"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestsApi, requestsKeys } from "./requests-api";

const STORAGE_KEY = "nfs_req_seen";

type SeenMap = Record<string, string>; // requestId → last seen status

function getSeenMap(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveSeenMap(map: SeenMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function useRequestNotifications() {
  const [unread, setUnread] = useState(0);

  const { data: requests } = useQuery({
    queryKey: requestsKeys.lists(),
    queryFn: requestsApi.list,
    refetchInterval: 15_000,
  });

  // Recompute unread count whenever data changes
  useEffect(() => {
    if (!requests) return;
    const seen = getSeenMap();
    let count = 0;
    for (const req of requests) {
      const lastSeen = seen[req.id];
      if (!lastSeen) {
        // First time seeing this request — if already actioned, it's unread
        if (req.status !== "pending") count++;
      } else if (lastSeen !== req.status) {
        // Status changed since we last viewed it
        count++;
      }
    }
    setUnread(count);
  }, [requests]);

  // Listen for markAllSeen() calls from any component instance
  useEffect(() => {
    const reset = () => setUnread(0);
    window.addEventListener("nfs-req-seen", reset);
    return () => window.removeEventListener("nfs-req-seen", reset);
  }, []);

  function markAllSeen() {
    if (!requests) return;
    const map: SeenMap = {};
    for (const req of requests) {
      map[req.id] = req.status;
    }
    saveSeenMap(map);
    setUnread(0);
    // Notify all other hook instances (e.g. layout badge)
    window.dispatchEvent(new Event("nfs-req-seen"));
  }

  // Call when a new request is submitted so it starts as "seen" at pending
  function markOneSeen(id: string, status: string) {
    const map = getSeenMap();
    map[id] = status;
    saveSeenMap(map);
  }

  return { unread, markAllSeen, markOneSeen };
}

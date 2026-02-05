"use client";

import { useState, useEffect } from "react";
import { subscribeToPush } from "@/lib/push/subscribe";

export default function PushPermissionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if push is supported and not yet subscribed
    if (!("PushManager" in window)) return;
    if (localStorage.getItem("pushDismissed")) return;

    navigator.serviceWorker?.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) setShow(true);
    });
  }, []);

  const handleAllow = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeToPush();
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pushDismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="mx-5 mb-4 rounded-2xl bg-orange-50 p-4">
      <p className="mb-2 text-sm font-medium text-gray-800">
        🔔 알림을 켜면 미션을 놓치지 않아요!
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleAllow}
          className="flex-1 rounded-lg bg-[var(--color-brand)] py-2 text-xs font-semibold text-white"
        >
          알림 켜기
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600"
        >
          나중에
        </button>
      </div>
    </div>
  );
}

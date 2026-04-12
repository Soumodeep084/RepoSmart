"use client";

import * as React from "react";

import { cn } from "./utils";

type LoadingVideoProps = {
  message?: string;
  fullScreen?: boolean;
  className?: string;
  videoSrc?: string;
};

export function LoadingVideo({
  message = "Loading…",
  fullScreen = true,
  className,
  videoSrc = "/videos/Loading.mp4",
}: LoadingVideoProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        fullScreen
          ? "fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-4"
          : "flex items-center justify-center",
        className,
      )}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-surface-1/90 p-4">
        <video
          className="w-full rounded-xl border border-[#30363d] bg-background"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {message ? <p className="mt-3 text-center text-sm text-[#8b949e]">{message}</p> : null}
      </div>
    </div>
  );
}

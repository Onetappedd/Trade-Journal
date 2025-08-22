"use client";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      expand={true}
      position="top-right"
      closeButton
    />
  );
}
export { toast } from "sonner";

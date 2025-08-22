"use client";
import { Toaster as SonnerToaster } from "sonner";
export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster richColors expand={true} position="top-right" closeButton {...props} />;
}
export { toast } from "sonner";

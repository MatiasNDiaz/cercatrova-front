"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const LoadingPage = dynamic(
  () => import("@/modules/landing/components/Loadingpage"),
  { ssr: false, loading: () => null }
);

export default function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setShow(true); // ✅ Siempre se muestra — cada recarga o entrada a la home
  }, []);

  const handleComplete = () => {
    setShow(false);
  };

  return (
    <>
      {mounted && show && (
        <LoadingPage onComplete={handleComplete} />
      )}
      {children}
    </>
  );
}
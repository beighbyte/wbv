"use client";

import React, { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";

interface RazorpayButtonProps {
  buttonId?: string;
  fallbackUrl?: string;
  className?: string;
}

export const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  buttonId = "pl_TwXdNlxd0SVJGC",
  fallbackUrl = "https://razorpay.me/@beighbyte",
  className = "",
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!buttonId || !formRef.current) return;

    formRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment_button_id", buttonId);
    script.async = true;
    script.onload = () => setScriptLoaded(true);

    formRef.current.appendChild(script);

    return () => {
      if (formRef.current) {
        formRef.current.innerHTML = "";
      }
    };
  }, [buttonId]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Official Razorpay Button Container */}
      <form ref={formRef} className={scriptLoaded ? "block" : "hidden"} />

      {/* Immediate fallback while script loads or if blocked */}
      {!scriptLoaded && (
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-wa-primary hover:bg-wa-primary-dark text-white text-xs font-medium transition active:scale-[0.98] shadow-xs"
        >
          <Heart className="w-3.5 h-3.5 text-pink-300 fill-pink-300" />
          <span>Support</span>
        </a>
      )}
    </div>
  );
};

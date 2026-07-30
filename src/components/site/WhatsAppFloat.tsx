"use client";

import { captureWhatsappClick } from "@/lib/captureWhatsappClick";

export default function WhatsAppFloat({ number }: { number: string }) {
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      onClick={captureWhatsappClick}
    >
      <svg>
        <use href="#ic-wa" />
      </svg>
    </a>
  );
}

// Sprite com todos os ícones em SVG usados no site, referenciados via
// <svg><use href="#ic-nome" /></svg>. Mantém o HTML leve (sem 1 arquivo
// por ícone) e é 100% customizável em cor via `currentColor`.
export default function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="ic-spark" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 0c0.6 6.2 5.2 10.8 11.4 11.4a0.6 0.6 0 0 1 0 1.2C17.2 13.2 12.6 17.8 12 24c-0.6-6.2-5.2-10.8-11.4-11.4a0.6 0.6 0 0 1 0-1.2C6.8 10.8 11.4 6.2 12 0z"
        />
      </symbol>
      <symbol id="ic-cross" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          d="M12 2.4v19.2M6.4 8.2h11.2"
        />
      </symbol>
      <symbol id="ic-phone" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.6 10.8a15.4 15.4 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 10.9 10.9 0 0 0 3.4.54 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 10.9 10.9 0 0 0 .54 3.4 1 1 0 0 1-.25 1z"
        />
      </symbol>
      <symbol id="ic-mail" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.5 6.5l8.5 6 8.5-6"
        />
      </symbol>
      <symbol id="ic-insta" viewBox="0 0 24 24">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </symbol>
      <symbol id="ic-chev" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 9l6 6 6-6"
        />
      </symbol>
      <symbol id="ic-zoom" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M20 20l-4.3-4.3M11 8.3v5.4M8.3 11h5.4" />
      </symbol>
      <symbol id="ic-close" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M5 5l14 14M19 5L5 19" />
      </symbol>
      <symbol id="ic-wa" viewBox="0 0 32 32">
        <path
          fill="currentColor"
          d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.5.7 4.83 1.9 6.82L4 29l7.35-1.85a12 12 0 0 0 4.67.94h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm0 21.86h-.01a10 10 0 0 1-5.1-1.4l-.37-.22-3.9.98 1.04-3.8-.24-.39a9.9 9.9 0 0 1-1.53-5.3c0-5.5 4.48-9.98 9.99-9.98 2.67 0 5.17 1.04 7.06 2.93a9.9 9.9 0 0 1 2.92 7.05c0 5.5-4.48 9.98-9.98 9.98zm5.47-7.47c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.9-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.5.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"
        />
      </symbol>
    </svg>
  );
}

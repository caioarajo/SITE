import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, guestPath, isDisabled, panelPath, wallPath } from "@/lib/telaoDemo/store";

export const dynamic = "force-dynamic";

export default async function PrototipoHub() {
  // Antes de db(): em produção o disco é somente leitura.
  if (isDisabled()) notFound();
  const host = (await headers()).get("host") ?? "";
  const isLocal = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);

  // Os links carregam as chaves do telão e do painel: só aparecem no próprio computador.
  if (!isLocal) {
    return (
      <main className="tl-hub">
        <h1 className="tl-serif">Protótipo do telão</h1>
        <p>Abra esta página no computador que está rodando o projeto, em localhost.</p>
      </main>
    );
  }

  db();
  const cards = [
    { href: wallPath(), title: "Telão", text: "Abra na TV ou no projetor e aperte F para tela cheia." },
    { href: panelPath(), title: "Painel de moderação", text: "Aprove fotos, pause o telão, simule convidados e baixe o QR code." },
    { href: guestPath(), title: "Convidado", text: "A página aberta pelo QR code. Teste também no celular." },
  ];

  return (
    <main className="tl-hub">
      <p className="tl-eyebrow">Protótipo local</p>
      <h1 className="tl-serif">Fotos dos convidados no telão</h1>
      <p className="tl-hub-lead">
        Os dados ficam em <code>.telao-demo/</code>, neste computador. Nada é enviado ao Supabase nem ao site publicado.
      </p>
      <div className="tl-hub-grid">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} target="_blank" className="tl-hub-card">
            <h2 className="tl-serif">{c.title}</h2>
            <p>{c.text}</p>
          </Link>
        ))}
      </div>
      <h2 className="tl-serif tl-hub-h2">Como testar em 1 minuto</h2>
      <ol className="tl-hub-steps">
        <li>Abra o Telão em uma janela e o Painel em outra.</li>
        <li>No Painel, clique em &quot;+5 fotos&quot; na seção Simulador e aprove as fotos na fila.</li>
        <li>Com o celular na mesma rede Wi-Fi, escaneie o QR code do telão e envie uma foto de verdade.</li>
        <li>Teste &quot;Pausar telão&quot;, troque o layout e use &quot;Mostrar agora&quot;.</li>
      </ol>
    </main>
  );
}

import type { Metadata } from "next";
import { Logo } from "@/components/casar/ui";
import "../lp-casar.css";

export const metadata: Metadata = { title: "Termos de uso e privacidade | LP Casar", robots: { index: false, follow: false } };

export default function TermosPage() {
  return (
    <main className="lc-root lc-terms">
      <Logo />
      <h1>Termos de uso e privacidade</h1>

      <h2>O serviço</h2>
      <p>O LP Casar permite criar um site de casamento, acompanhar confirmações de presença, receber recados e divulgar uma lista de presentes. É oferecido pela LP Assessoria e Cerimonial.</p>

      <h2>Presentes por Pix</h2>
      <p>O convidado paga diretamente para a chave Pix cadastrada pelos noivos. O LP Casar não recebe, não guarda e não repassa dinheiro, e não confirma pagamentos. Cabe aos noivos conferir o recebimento no banco. Reembolsos são tratados entre convidado e noivos.</p>

      <h2>Responsabilidades dos noivos</h2>
      <p>Os noivos respondem pelo conteúdo que publicam, incluindo fotos de terceiros e dados de convidados que cadastram, e devem ter autorização para usá-los.</p>

      <h2>Dados tratados</h2>
      <p>Guardamos o e-mail de acesso dos noivos, o conteúdo do site, a lista de convidados e o que os convidados enviam: nome, telefone opcional, confirmação, recados e avisos de presente. Usamos esses dados apenas para fazer o serviço funcionar. Não vendemos dados pessoais.</p>

      <h2>Seus direitos</h2>
      <p>Os noivos podem corrigir e apagar dados pelo painel, e excluir o site inteiro em Minha Conta. Convidados podem pedir a correção ou remoção dos seus dados aos noivos ou à LP Assessoria e Cerimonial.</p>

      <h2>E-mails</h2>
      <p>Mensagens sobre a conta são enviadas a todos. Novidades e promoções, só a quem autorizou no cadastro.</p>

      <a className="lc-btn lc-btn-sm" href="/lp-casar/entrar?modo=criar">Voltar ao cadastro</a>
    </main>
  );
}

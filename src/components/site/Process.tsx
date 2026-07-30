import Reveal, { RevealGroup, RevealItem } from "./Reveal";

const STEPS = [
  {
    num: "01",
    title: "Primeiro contato",
    text: "Você me chama no WhatsApp ou preenche o formulário contando um pouco sobre o evento.",
  },
  {
    num: "02",
    title: "Alinhamento",
    text: "Conversamos sobre estilo, expectativas e escolhemos juntos o pacote ideal para vocês.",
  },
  {
    num: "03",
    title: "Planejamento",
    text: "Cuido de fornecedores, contratos, cronograma e cada detalhe, com vocês sempre por perto.",
  },
  {
    num: "04",
    title: "O grande dia",
    text: "Estou lá do início ao fim, para que vocês vivam cada momento com leveza e confiança.",
  },
];

export default function Process() {
  return (
    <section className="process">
      <div className="wrap">
        <Reveal className="section-head center">
          <div className="eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            Como funciona
          </div>
          <h2 className="serif">Do primeiro &quot;oi&quot; ao último brinde</h2>
          <p>
            Um caminho simples e transparente, para vocês saberem exatamente o que esperar em cada
            etapa.
          </p>
        </Reveal>

        <RevealGroup className="process-list">
          {STEPS.map((step) => (
            <RevealItem key={step.num} className="p-step">
              <div className="num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

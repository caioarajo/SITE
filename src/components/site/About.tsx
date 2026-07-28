import Reveal from "./Reveal";

const NICHES = ["15 anos", "Casamentos", "Formaturas", "Empresarial", "Infantil", "Eventos em geral"];

export default function About({ liaPortraitSrc }: { liaPortraitSrc: string }) {
  return (
    <section className="about" id="sobre">
      <div className="wrap">
        <Reveal className="about-photo">
          <div className="ring" />
          <div className="frame">
            <img src={liaPortraitSrc} alt="Lia Pontes, cerimonialista e assessora de eventos" />
          </div>
          <div className="about-seal">
            <span className="cross-wrap">
              <svg className="cross-glow">
                <use href="#ic-spark" />
              </svg>
              <span className="cross">
                <svg>
                  <use href="#ic-cross" />
                </svg>
              </span>
            </span>
            <b>Especialista em casamentos católicos</b>
            <span>Protocolo litúrgico completo</span>
          </div>
        </Reveal>

        <div className="about-body">
          <Reveal className="eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            Quem sou
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="serif">Lia Pontes</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="big">
              &ldquo;Cerimonialista e assessora de eventos apaixonada por transformar sonhos em
              experiências inesquecíveis.&rdquo;
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <p>
              Com sensibilidade, organização e olhar estratégico, cuido de cada detalhe para que
              você viva seu grande dia com leveza, alegria e confiança. Minha missão é fazer com que
              cada evento tenha a identidade dos anfitriões, respeitando suas escolhas e trazendo
              soluções criativas e elegantes.
            </p>
          </Reveal>

          <Reveal delay={0.32} className="pill-row">
            {NICHES.map((n) => (
              <span key={n} className="pill">
                {n}
              </span>
            ))}
          </Reveal>

          <Reveal className="mission-box">
            <b className="serif-alt">Nossa missão</b>
            <p>
              Organizar e conduzir seu evento é a nossa principal missão. Auxiliamos desde o
              planejamento até a condução do cronograma no dia, para que os anfitriões cumprimentem
              seus convidados e aproveitem o momento com tranquilidade.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

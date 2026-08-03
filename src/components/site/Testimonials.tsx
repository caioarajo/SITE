import type { TestimonialRow } from "@/lib/types";
import Reveal, { RevealGroup, RevealItem } from "./Reveal";

export default function Testimonials({ testimonials }: { testimonials: TestimonialRow[] }) {
  const featured = testimonials.find((t) => t.is_featured) ?? null;
  const short = testimonials.filter((t) => !t.is_featured);

  return (
    <section className="testimonials" id="depoimentos">
      <span
        className="spark float-spark gold"
        style={{ width: 20, height: 20, top: "8%", left: "88%" }}
      >
        <span className="twinkle-inner d3">
          <svg>
            <use href="#ic-spark" />
          </svg>
        </span>
      </span>

      <div className="wrap">
        <Reveal className="section-head center">
          <div className="eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            Depoimentos
          </div>
          <h2 className="serif">O que dizem os noivos</h2>
          <p>Mais do que organizar eventos, construo histórias ao lado de cada casal.</p>
        </Reveal>

        <RevealGroup className="quote-grid">
          {short.map((t) => (
            <RevealItem key={t.id} className="quote-card">
              <span className="spark">
                <svg>
                  <use href="#ic-spark" />
                </svg>
              </span>
              <p>&ldquo;{t.quote}&rdquo;</p>
              <div className="who">
                <span className="dot">{t.couple_names.charAt(0)}</span>
                <div>
                  <b>{t.couple_names}</b>
                  <span>Noiva</span>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {featured && (
          <Reveal className="feature-quote">
            {featured.photo_url_1 && (
              <div className="fq-photo">
                <span className="fq-photo-mat" aria-hidden="true" />
                <div className="fq-photo-frame">
                  <img src={featured.photo_url_1} alt={featured.couple_names} />
                </div>
              </div>
            )}
            <div className="fq-text">
              <span className="mark">&ldquo;</span>
              <p>{featured.quote}</p>
              <div className="fq-name">{featured.couple_names}</div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

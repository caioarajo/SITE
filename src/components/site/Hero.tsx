"use client";

import { motion, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";
import type { MouseEvent } from "react";
import { captureWhatsappClick } from "@/lib/captureWhatsappClick";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.13, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 0.84, 0.36, 1] },
  },
};

const photoVariant: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1, ease: [0.16, 0.84, 0.36, 1], delay: 0.3 },
  },
};

function FloatingSpark({
  style,
  className,
  depth,
  delayClass,
  mouseX,
  mouseY,
}: {
  style: React.CSSProperties;
  className: string;
  depth: number;
  delayClass?: string;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
}) {
  const x = useTransform(mouseX, (v) => v * depth);
  const y = useTransform(mouseY, (v) => v * depth);
  return (
    <motion.span className={className} style={{ ...style, x, y }}>
      <span className={["twinkle-inner", delayClass].filter(Boolean).join(" ")}>
        <svg>
          <use href="#ic-spark" />
        </svg>
      </span>
    </motion.span>
  );
}

export default function Hero({ heroPhotoSrc, whatsappNumber }: { heroPhotoSrc: string; whatsappNumber: string }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 120, damping: 20 });
  const mouseY = useSpring(rawY, { stiffness: 120, damping: 20 });

  const photoX = useTransform(mouseX, (v) => v * 8);
  const photoY = useTransform(mouseY, (v) => v * 8);

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <section className="hero" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <FloatingSpark
        className="spark float-spark"
        style={{ width: 26, height: 26, top: "14%", left: "6%" }}
        depth={10}
        mouseX={mouseX}
        mouseY={mouseY}
      />
      <FloatingSpark
        className="spark float-spark gold"
        style={{ width: 18, height: 18, top: "8%", left: "58%" }}
        depth={16}
        delayClass="d2"
        mouseX={mouseX}
        mouseY={mouseY}
      />
      <FloatingSpark
        className="spark float-spark"
        style={{ width: 14, height: 14, top: "66%", left: "16%" }}
        depth={22}
        delayClass="d3"
        mouseX={mouseX}
        mouseY={mouseY}
      />
      <FloatingSpark
        className="spark float-spark gold"
        style={{ width: 22, height: 22, top: "12%", left: "92%" }}
        depth={12}
        delayClass="d4"
        mouseX={mouseX}
        mouseY={mouseY}
      />

      <div className="wrap">
        <motion.div className="hero-copy" variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="eyebrow hero-eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            LP Assessoria &amp; Cerimonial
          </motion.div>

          <motion.h1 variants={item} className="serif">
            Cada detalhe do
            <br />
            seu grande dia,
            <br />
            <em>cuidado com carinho.</em>
          </motion.h1>

          <motion.p variants={item} className="lead">
            Cerimonialista e assessora de eventos em Manaus há mais de 15 anos. Do primeiro encontro
            com os fornecedores ao último brinde da festa, cuido de tudo para que vocês vivam o dia
            com leveza, alegria e confiança.
          </motion.p>

          <motion.div variants={item} className="cred-badge">
            <span className="cross-wrap">
              <svg className="cross-glow">
                <use href="#ic-spark" />
              </svg>
              <svg className="cross">
                <use href="#ic-cross" />
              </svg>
            </span>{" "}
            Especialista em casamentos católicos
          </motion.div>

          <motion.div variants={item} className="actions">
            <a
              className="btn btn-primary"
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={captureWhatsappClick}
            >
              Fale comigo no WhatsApp
            </a>
            <a className="btn btn-ghost" href="#portfolio">
              Ver portfólio
            </a>
          </motion.div>

          <motion.div variants={item} className="stats">
            <div>
              <b>15+</b>
              <span>Anos de experiência</span>
            </div>
            <div>
              <b>6</b>
              <span>Nichos de eventos atendidos</span>
            </div>
            <div>
              <b>100%</b>
              <span>Dedicação ao seu grande dia</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="hero-visual" variants={photoVariant} initial="hidden" animate="show">
          <motion.div className="hero-photo-outer" style={{ x: photoX, y: photoY }}>
            <span className="hero-photo-mat" aria-hidden="true" />
            <div className="hero-photo-frame">
              <img
                src={heroPhotoSrc}
                alt="Noivos abraçados diante do altar, sob um arco com cruz, em cerimônia organizada pela LP Assessoria e Cerimonial"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="scroll-cue">
        <span>Role para saber mais</span>
        <span className="line" />
      </div>
    </section>
  );
}

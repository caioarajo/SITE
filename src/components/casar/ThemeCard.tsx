"use client";

import type { Theme } from "@/lib/casar/themes";
import { defaultSiteData, toPublicData, type PublicSiteData } from "@/lib/casar/types";
import { Countdown, Divider, SiteHero, themeStyle } from "./SiteView";

const SAMPLE_PHOTOS = ["/images/hero-couple.jpg", "/images/casar/art-3.jpg", "/images/casar/art-4.jpg"];

function sampleData(theme: Theme, palette: number, name1: string, name2: string, photos: string[]) {
  const data = defaultSiteData();
  data.couple.name1 = name1;
  data.couple.name2 = name2;
  data.wedding = { date: "2027-07-21", city: "Manaus · AM" };
  data.theme = { ...data.theme, id: theme.id, palette };
  data.intro.heroImage = photos[0];
  data.intro.gallery = photos.slice(1);
  return toPublicData(data);
}

/** O começo do site, para a miniatura mostrar também o estilo das seções. */
function MiniSite({ theme, data, narrow }: { theme: Theme; data: PublicSiteData; narrow?: boolean }) {
  return (
    <div className={`ls-root is-${theme.layout} t-${theme.id} is-mini${narrow ? " is-narrow" : ""}`} style={themeStyle(data)}>
      <SiteHero data={data} layout={theme.layout} />
      <Countdown date="" sample />
      <section className="ls-section ls-center">
        <Divider />
        <h2>Boas-vindas ao nosso site</h2>
        <p>{data.intro.welcome}</p>
      </section>
    </div>
  );
}

type Props = {
  theme: Theme;
  palette?: number;
  name1?: string;
  name2?: string;
  photos?: string[];
  action?: React.ReactNode;
};

/** Miniatura real do tema: desenha o mesmo cabeçalho do site, no computador e no celular. */
export default function ThemeCard({ theme, palette = 0, name1 = "Marina", name2 = "Rafael", photos = SAMPLE_PHOTOS, action }: Props) {
  const data = sampleData(theme, palette, name1 || "Marina", name2 || "Rafael", photos.length ? photos : SAMPLE_PHOTOS);
  return (
    <article className="lc-theme">
      <h3>{theme.name}</h3>
      <div className="lc-theme-stage">
        <div className="lc-browser" aria-hidden="true">
          <div className="lc-browser-bar"><i /><i /><i /><b /></div>
          <div className="lc-mini lc-mini-desktop"><MiniSite theme={theme} data={data} /></div>
        </div>
        <div className="lc-phone" aria-hidden="true">
          <div className="lc-mini lc-mini-phone"><MiniSite theme={theme} data={data} narrow /></div>
        </div>
      </div>
      <p className="lc-theme-colors">
        <span className="lc-swatches" aria-hidden="true">
          {theme.palettes.slice(0, 3).map((item) => <i key={item.name} style={{ background: item.primary }} />)}
        </span>
        Diversas opções de cores
      </p>
      {action}
    </article>
  );
}

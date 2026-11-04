"use client";

import type { Theme } from "@/lib/casar/themes";
import { defaultSiteData, toPublicData } from "@/lib/casar/types";
import { Countdown, SiteHero, themeStyle } from "./SiteView";

const SAMPLE_PHOTOS = ["/images/hero-couple.jpg", "/images/portfolio-01.jpg", "/images/portfolio-02.jpg"];

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
        {theme.isNew && <span className="lc-theme-new">Novo</span>}
        <div className="lc-browser" aria-hidden="true">
          <div className="lc-browser-bar"><i /><i /><i /><b /></div>
          <div className="lc-mini lc-mini-desktop">
            <div className={`ls-root is-${theme.layout} is-mini`} style={themeStyle(data)}>
              <SiteHero data={data} layout={theme.layout} />
              <Countdown date="" sample />
            </div>
          </div>
        </div>
        <div className="lc-phone" aria-hidden="true">
          <div className="lc-mini lc-mini-phone">
            <div className={`ls-root is-${theme.layout} is-mini is-narrow`} style={themeStyle(data)}>
              <SiteHero data={data} layout={theme.layout} />
              <Countdown date="" sample />
            </div>
          </div>
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

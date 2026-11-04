"use client";

import { useState } from "react";
import { FONT_OPTIONS, THEMES, themeById } from "@/lib/casar/themes";
import { paletteOf, SECTION_LABELS, youtubeId, type CustomSection, type SectionId, type Venue } from "@/lib/casar/types";
import type { PanelProps } from "../Editor";
import { Field, Icon, ImageField, newId, TextArea, Toggle } from "../ui";

export function ThemePanel({ data, update }: PanelProps) {
  return (
    <div className="lc-theme-list">
      <p className="lc-muted">O conteúdo de vocês continua igual: só a aparência muda.</p>
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`lc-theme-pick${data.theme.id === theme.id ? " is-on" : ""}`}
          aria-pressed={data.theme.id === theme.id}
          onClick={() => update((d) => ({ ...d, theme: { ...d.theme, id: theme.id, palette: 0, custom: null } }))}
        >
          <span className="lc-swatches" aria-hidden="true">
            {theme.palettes.slice(0, 3).map((item) => <i key={item.name} style={{ background: item.primary }} />)}
          </span>
          <span style={{ fontFamily: theme.display }}>{theme.name}</span>
          {data.theme.id === theme.id && <Icon name="check" size={18} />}
        </button>
      ))}
    </div>
  );
}

export function CustomizePanel({ data, update }: PanelProps) {
  const theme = themeById(data.theme.id);
  const { palette } = paletteOf(data);
  const setTheme = (patch: Partial<PanelProps["data"]["theme"]>) => update((d) => ({ ...d, theme: { ...d.theme, ...patch } }));
  const setCustom = (key: "primary" | "accent", value: string) =>
    setTheme({ custom: { primary: palette.primary, accent: palette.accent, [key]: value } });
  return (
    <>
      <h3 className="lc-panel-h3">Cores do tema {theme.name}</h3>
      <div className="lc-palettes">
        {theme.palettes.map((item, i) => (
          <button
            key={item.name}
            type="button"
            title={item.name}
            aria-pressed={!data.theme.custom && data.theme.palette === i}
            className={!data.theme.custom && data.theme.palette === i ? "is-on" : ""}
            onClick={() => setTheme({ palette: i, custom: null })}
          >
            <i style={{ background: item.primary }} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
      <h3 className="lc-panel-h3">Ou escolham as de vocês</h3>
      <div className="lc-row-2">
        <label className="lc-color"><span>Cor principal</span><input type="color" value={palette.primary} onChange={(e) => setCustom("primary", e.target.value)} /></label>
        <label className="lc-color"><span>Cor de fundo das seções</span><input type="color" value={palette.accent} onChange={(e) => setCustom("accent", e.target.value)} /></label>
      </div>

      <h3 className="lc-panel-h3">Fonte dos títulos</h3>
      <div className="lc-fonts" role="radiogroup" aria-label="Fonte dos títulos">
        <label className={!data.theme.font ? "is-on" : ""}>
          <input type="radio" name="font" checked={!data.theme.font} onChange={() => setTheme({ font: "" })} />
          <span style={{ fontFamily: theme.display }}>Do tema</span>
        </label>
        {FONT_OPTIONS.map((font) => (
          <label key={font.name} className={data.theme.font === font.value ? "is-on" : ""}>
            <input type="radio" name="font" checked={data.theme.font === font.value} onChange={() => setTheme({ font: font.value })} />
            <span style={{ fontFamily: font.value }}>{font.name}</span>
          </label>
        ))}
      </div>

      <h3 className="lc-panel-h3">Elementos gráficos</h3>
      <Toggle label="Mostrar ramos e ornamentos" checked={data.theme.decor} onChange={(decor) => setTheme({ decor })} />
    </>
  );
}

function PhotoList({ label, photos, max, onChange }: { label: string; photos: string[]; max: number; onChange: (photos: string[]) => void }) {
  return (
    <div className="lc-photo-list">
      {photos.map((photo, i) => (
        <ImageField
          key={`${photo}-${i}`}
          label={`Foto ${i + 1}`}
          value={photo}
          onChange={(url) => onChange(url ? photos.map((item, index) => (index === i ? url : item)) : photos.filter((_, index) => index !== i))}
        />
      ))}
      {photos.length < max && <ImageField label={`${label}: adicionar (${photos.length}/${max})`} value="" onChange={(url) => url && onChange([...photos, url])} />}
    </div>
  );
}

export function IntroPanel({ data, update }: PanelProps) {
  const setIntro = (patch: Partial<PanelProps["data"]["intro"]>) => update((d) => ({ ...d, intro: { ...d.intro, ...patch } }));
  const setSlider = (patch: Partial<PanelProps["data"]["intro"]["slider"]>) => setIntro({ slider: { ...data.intro.slider, ...patch } });
  const gallery = [data.intro.gallery[0] ?? "", data.intro.gallery[1] ?? ""];
  return (
    <>
      <ImageField label="Foto principal (computador)" value={data.intro.heroImage} onChange={(heroImage) => setIntro({ heroImage })} />
      <ImageField label="Foto principal no celular (opcional)" value={data.intro.heroImageMobile} onChange={(heroImageMobile) => setIntro({ heroImageMobile })} />
      <Field label="Frase de destaque" maxLength={80} value={data.intro.subtitle} onChange={(e) => setIntro({ subtitle: e.target.value })} />
      <TextArea label="Texto de boas-vindas" maxLength={1000} value={data.intro.welcome} onChange={(e) => setIntro({ welcome: e.target.value })} />
      {themeById(data.theme.id).layout === "mosaic" && gallery.map((photo, i) => (
        <ImageField
          key={i}
          label={`Foto ${i + 2} do mosaico`}
          value={photo}
          onChange={(url) => {
            const next = [...gallery];
            next[i] = url;
            setIntro({ gallery: next.filter(Boolean) });
          }}
        />
      ))}

      <h3 className="lc-panel-h3">Slide de fotos na abertura</h3>
      <p className="lc-muted">Aparece toda vez que o site é aberto, e o convidado pode pular.</p>
      <Toggle label="Mostrar slide de abertura" checked={data.intro.slider.enabled} onChange={(enabled) => setSlider({ enabled })} />
      {data.intro.slider.enabled && (
        <>
          <Field label="Segundos por foto" type="number" min={2} max={15} value={data.intro.slider.seconds} onChange={(e) => setSlider({ seconds: Math.min(Math.max(Number(e.target.value), 2), 15) })} />
          <PhotoList label="Slide" photos={data.intro.slider.photos} max={12} onChange={(photos) => setSlider({ photos })} />
        </>
      )}
    </>
  );
}

function VenueForm({ venue, onChange }: { venue: Venue; onChange: (patch: Partial<Venue>) => void }) {
  return (
    <>
      <Field label="Nome do local" maxLength={120} value={venue.name} onChange={(e) => onChange({ name: e.target.value })} />
      <Field label="Endereço" hint="Usado nos botões do Google Maps e do Waze." maxLength={200} value={venue.address} onChange={(e) => onChange({ address: e.target.value })} />
      <Field label="Horário" placeholder="17h" maxLength={40} value={venue.time} onChange={(e) => onChange({ time: e.target.value })} />
      <TextArea label="Observações" rows={2} maxLength={400} value={venue.notes} onChange={(e) => onChange({ notes: e.target.value })} />
    </>
  );
}

function CustomForm({ section, onChange, onRemove }: { section: CustomSection; onChange: (patch: Partial<CustomSection>) => void; onRemove: () => void }) {
  return (
    <>
      <Field label="Título" maxLength={60} value={section.title} onChange={(e) => onChange({ title: e.target.value })} />
      <TextArea label="Texto" rows={5} maxLength={3000} value={section.text} onChange={(e) => onChange({ text: e.target.value })} />
      <ImageField label="Foto" value={section.photo} onChange={(photo) => onChange({ photo })} />
      <Field label="Vídeo do YouTube (opcional)" inputMode="url" value={section.video} onChange={(e) => onChange({ video: e.target.value })} />
      {section.video && !youtubeId(section.video) && <p className="lc-error" role="alert">Este link não parece ser de um vídeo do YouTube.</p>}
      <button type="button" className="lc-link-danger" onClick={onRemove}>Excluir esta seção</button>
    </>
  );
}

export function SectionsPanel({ data, update }: PanelProps) {
  const [open, setOpen] = useState<string | null>(null);
  const setCouple = (patch: Partial<PanelProps["data"]["couple"]>) => update((d) => ({ ...d, couple: { ...d.couple, ...patch } }));

  const move = (id: string, delta: number) =>
    update((d) => {
      const order = [...d.sectionOrder];
      const from = order.indexOf(id);
      const to = from + delta;
      if (to < 0 || to >= order.length) return d;
      [order[from], order[to]] = [order[to], order[from]];
      return { ...d, sectionOrder: order };
    });

  const patchCustom = (id: string, patch: Partial<CustomSection>) =>
    update((d) => ({ ...d, customSections: d.customSections.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

  const addCustom = () => {
    const id = `c${newId()}`;
    update((d) => ({
      ...d,
      customSections: [...d.customSections, { id, title: "Homenagem especial", text: "", photo: "", video: "", visible: true }],
      sectionOrder: [...d.sectionOrder, id],
    }));
    setOpen(id);
  };

  const forms: Partial<Record<SectionId, React.ReactNode>> = {
    about: (
      <>
        <TextArea label="A história de vocês" rows={6} maxLength={3000} value={data.couple.story} onChange={(e) => setCouple({ story: e.target.value })} />
        <ImageField label={`Foto de ${data.couple.name1 || "um"}`} value={data.couple.photo1} onChange={(photo1) => setCouple({ photo1 })} />
        <ImageField label={`Foto de ${data.couple.name2 || "outro"}`} value={data.couple.photo2} onChange={(photo2) => setCouple({ photo2 })} />
      </>
    ),
    gallery: <PhotoList label="Galeria" photos={data.gallery} max={40} onChange={(gallery) => update((d) => ({ ...d, gallery }))} />,
    padrinhos: (
      <>
        {data.padrinhos.map((person) => {
          const patch = (change: Partial<typeof person>) =>
            update((d) => ({ ...d, padrinhos: d.padrinhos.map((item) => (item.id === person.id ? { ...item, ...change } : item)) }));
          return (
            <div key={person.id} className="lc-subcard">
              <Field label="Nome" maxLength={80} value={person.name} onChange={(e) => patch({ name: e.target.value })} />
              <Field label="Papel" placeholder="Madrinha, padrinho, pajem…" maxLength={60} value={person.role} onChange={(e) => patch({ role: e.target.value })} />
              <ImageField label="Foto" value={person.photo} onChange={(photo) => patch({ photo })} />
              <button type="button" className="lc-link-danger" onClick={() => update((d) => ({ ...d, padrinhos: d.padrinhos.filter((item) => item.id !== person.id) }))}>Remover</button>
            </div>
          );
        })}
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" onClick={() => update((d) => ({ ...d, padrinhos: [...d.padrinhos, { id: newId(), name: "", role: "", photo: "" }] }))}>
          <Icon name="plus" size={16} /> Adicionar
        </button>
      </>
    ),
    ceremony: <VenueForm venue={data.ceremony} onChange={(patch) => update((d) => ({ ...d, ceremony: { ...d.ceremony, ...patch } }))} />,
    party: <VenueForm venue={data.party} onChange={(patch) => update((d) => ({ ...d, party: { ...d.party, ...patch } }))} />,
    dresscode: <TextArea label="Qual é o traje?" maxLength={1000} value={data.dressCode} onChange={(e) => update((d) => ({ ...d, dressCode: e.target.value }))} />,
    lodging: (
      <>
        {data.lodging.map((place) => {
          const patch = (change: Partial<typeof place>) =>
            update((d) => ({ ...d, lodging: d.lodging.map((item) => (item.id === place.id ? { ...item, ...change } : item)) }));
          return (
            <div key={place.id} className="lc-subcard">
              <Field label="Nome" maxLength={100} value={place.name} onChange={(e) => patch({ name: e.target.value })} />
              <Field label="Link (opcional)" inputMode="url" maxLength={300} value={place.url} onChange={(e) => patch({ url: e.target.value })} />
              <TextArea label="Dica" rows={2} maxLength={400} value={place.notes} onChange={(e) => patch({ notes: e.target.value })} />
              <button type="button" className="lc-link-danger" onClick={() => update((d) => ({ ...d, lodging: d.lodging.filter((item) => item.id !== place.id) }))}>Remover</button>
            </div>
          );
        })}
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" onClick={() => update((d) => ({ ...d, lodging: [...d.lodging, { id: newId(), name: "", url: "", notes: "" }] }))}>
          <Icon name="plus" size={16} /> Adicionar
        </button>
      </>
    ),
  };

  return (
    <div className="lc-sections">
      <p className="lc-muted">Use as setas para mudar a ordem no menu e no site.</p>
      {data.sectionOrder.map((id, index) => {
        const custom = data.customSections.find((item) => item.id === id);
        const base = SECTION_LABELS[id as SectionId];
        const name = custom ? custom.title : data.sectionLabels[id] ?? base;
        const form = custom
          ? (
            <CustomForm
              section={custom}
              onChange={(patch) => patchCustom(id, patch)}
              onRemove={() => {
                setOpen(null);
                update((d) => ({ ...d, customSections: d.customSections.filter((item) => item.id !== id), sectionOrder: d.sectionOrder.filter((item) => item !== id) }));
              }}
            />
          )
          : forms[id as SectionId];
        return (
          <div key={id} className="lc-section-row">
            <div className="lc-section-line">
              <span className="lc-order">
                <button type="button" disabled={index === 0} aria-label={`Subir ${name}`} onClick={() => move(id, -1)}><Icon name="up" size={14} /></button>
                <button type="button" disabled={index === data.sectionOrder.length - 1} aria-label={`Descer ${name}`} onClick={() => move(id, 1)}><Icon name="down" size={14} /></button>
              </span>
              <Toggle
                label={name || "Sem título"}
                checked={custom ? custom.visible : data.sections[id as SectionId]}
                onChange={(value) => (custom ? patchCustom(id, { visible: value }) : update((d) => ({ ...d, sections: { ...d.sections, [id]: value } })))}
              />
              <button type="button" className="lc-icon-btn" aria-expanded={open === id} aria-label={`Editar ${name}`} onClick={() => setOpen(open === id ? null : id)}>
                <Icon name={open === id ? "close" : "pencil"} size={18} />
              </button>
            </div>
            {open === id && (
              <div className="lc-section-form">
                {!custom && (
                  <Field
                    label="Nome no menu"
                    placeholder={base}
                    maxLength={40}
                    value={data.sectionLabels[id] ?? ""}
                    onChange={(e) => update((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, [id]: e.target.value } }))}
                  />
                )}
                {form}
                {(id === "gifts" || id === "rsvp" || id === "mural") && (
                  <p className="lc-muted">{id === "gifts" ? "O conteúdo fica em Lista de Presentes, no topo." : id === "rsvp" ? "As regras ficam em Meus convidados › Configurar confirmação." : "Os recados ficam em Meus convidados › Mural de recados."}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm lc-add-section" onClick={addCustom}>
        <Icon name="plus" size={16} /> Adicionar página (homenagem, vídeo, dicas…)
      </button>
    </div>
  );
}

export function MusicPanel({ data, update }: PanelProps) {
  const tracks = data.music.tracks;
  const setTracks = (next: string[]) => update((d) => ({ ...d, music: { ...d.music, tracks: next } }));
  return (
    <>
      <p className="lc-muted">Localizem as músicas no YouTube e colem o link de cada uma.</p>
      {tracks.map((url, i) => (
        <div key={i}>
          <Field label={`Música ${i + 1}`} inputMode="url" placeholder="https://www.youtube.com/watch?v=…" value={url} onChange={(e) => setTracks(tracks.map((item, index) => (index === i ? e.target.value : item)))} />
          {url && !youtubeId(url) && <p className="lc-error" role="alert">Este link não parece ser de um vídeo do YouTube.</p>}
          <button type="button" className="lc-link-danger" onClick={() => setTracks(tracks.filter((_, index) => index !== i))}>Remover</button>
        </div>
      ))}
      {tracks.length < 10 && (
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm lc-add-section" onClick={() => setTracks([...tracks, ""])}><Icon name="plus" size={16} /> Adicionar música</button>
      )}
      <Toggle label="Tentar tocar automaticamente" checked={data.music.autoplay} onChange={(autoplay) => update((d) => ({ ...d, music: { ...d.music, autoplay } }))} />
      <p className="lc-muted">Celulares e alguns navegadores bloqueiam o som automático. Nesses casos, o convidado toca pelo botão no canto da tela.</p>
    </>
  );
}

interface Settings {
  whatsapp: string;
  email: string;
  instagram: string;
}

export default function Footer({
  logoCreamSrc,
  settings,
}: {
  logoCreamSrc: string;
  settings: Settings;
}) {
  return (
    <footer>
      <div className="wrap">
        <a className="brand" href="#top">
          <img src={logoCreamSrc} alt="LP Assessoria e Cerimonial" />
        </a>
        <nav>
          <a href="#sobre">Sobre</a>
          <a href="#servicos">Serviços</a>
          <a href="#portfolio">Portfólio</a>
          <a href="#depoimentos">Depoimentos</a>
          <a href="#contato">Contato</a>
        </nav>
        <div className="social">
          <a
            href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <svg>
              <use href="#ic-insta" />
            </svg>
          </a>
          <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <svg>
              <use href="#ic-wa" />
            </svg>
          </a>
          <a href={`mailto:${settings.email}`} aria-label="E-mail">
            <svg>
              <use href="#ic-mail" />
            </svg>
          </a>
        </div>
      </div>
      <div className="bottom">
        Manaus, AM · © {new Date().getFullYear()} LP Assessoria e Cerimonial. Todos os direitos
        reservados. · <a href="/admin/login">Área administrativa</a>
      </div>
    </footer>
  );
}

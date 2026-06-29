import type { Route } from "next";
import Link from "next/link";

type FooterColumn = {
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
};

const COLUMNS: FooterColumn[] = [
  {
    title: "Купить",
    links: [
      { href: "/catalog", label: "Все товары" },
      { href: "/catalog?category=panels", label: "Солнечные панели" },
      { href: "/catalog?category=inverters", label: "Инверторы" },
      { href: "/catalog?category=batteries", label: "Аккумуляторы" },
      { href: "/catalog?category=mounting", label: "Монтаж" },
      { href: "/catalog?sort=price_asc", label: "Самые дешёвые" }
    ]
  },
  {
    title: "Поддержка",
    links: [
      { href: "/contacts", label: "Связаться с нами" },
      { href: "/delivery", label: "Доставка и оплата" },
      { href: "/warranty", label: "Гарантия и возврат" },
      { href: "/faq", label: "Частые вопросы" },
      { href: "/central/login", label: "Личный кабинет" }
    ]
  },
  {
    title: "Документы",
    links: [
      { href: "/oferta", label: "Публичная оферта" },
      { href: "/privacy", label: "Политика конфиденциальности" },
      { href: "/terms", label: "Пользовательское соглашение" },
      { href: "/requisites", label: "Реквизиты" }
    ]
  },
  {
    title: "О компании",
    links: [
      { href: "/about", label: "О Sun Store" },
      { href: "/blog", label: "Блог и статьи" },
      { href: "/reviews", label: "Отзывы" },
      { href: "/contacts", label: "Контакты" }
    ]
  }
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      {/* Top dark bar — quick CTA */}
      <div className="site-footer__cta">
        <div className="shell site-footer__cta-inner">
          <div>
            <strong>Нужна помощь с выбором?</strong>
            <span>Позвоните нам или оставьте заявку — поможем собрать систему под ваш бюджет.</span>
          </div>
          <Link href={"/contacts" as Route} className="site-footer__cta-btn">
            Связаться с экспертом →
          </Link>
        </div>
      </div>

      {/* Main multi-column grid */}
      <div className="shell site-footer__main">
        <div className="site-footer__brand">
          <Link href={"/" as Route} className="site-footer__logo" aria-label="Sun Store — на главную">
            <span className="site-footer__sun" aria-hidden="true" />
            <span>
              Sun Store
              <small>solar marketplace</small>
            </span>
          </Link>
          <p className="site-footer__tagline">
            Маркетплейс солнечной энергетики: панели, инверторы и комплектующие
            с быстрой доставкой и гарантией производителя.
          </p>
          <div className="site-footer__trust">
            <span className="site-footer__trust-pill">✓ Гарантия 25 лет</span>
            <span className="site-footer__trust-pill">✓ Оплата T-Bank</span>
            <span className="site-footer__trust-pill">✓ Доставка по РФ</span>
          </div>
        </div>

        <nav className="site-footer__cols" aria-label="Подвал">
          {COLUMNS.map((col) => (
            <div key={col.title} className="site-footer__col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href as Route}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Legal strip */}
      <div className="shell site-footer__legal">
        <p>
          © {year} Sun Store. Все права защищены. ИНН 7700000000 · ОГРН 1157700000000
        </p>
        <p className="site-footer__legal-notice">
          Информация на сайте носит справочный характер и не является публичной офертой (ст. 437 ГК РФ).
        </p>
      </div>
    </footer>
  );
}

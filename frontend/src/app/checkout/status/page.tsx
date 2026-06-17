import Link from "next/link";

export default async function CheckoutStatusPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "success";

  const copy =
    status === "rejected"
      ? {
          title: "Оплата не завершена",
          description:
            "Проверьте данные карты или попробуйте снова. Заказ можно переоформить из корзины.",
          action: "Вернуться к checkout"
        }
      : {
          title: "Запрос на оплату создан",
          description:
            "Если backend недоступен, вы видите mock status page. При подключённом API сюда вернёт T-Bank flow.",
          action: "Вернуться в каталог"
        };

  return (
    <div className="shell page-stack">
      <section className="status-card">
        <p className="eyebrow">Checkout status</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <Link
          href={status === "rejected" ? "/checkout" : "/catalog"}
          className="button button--primary"
        >
          {copy.action}
        </Link>
      </section>
    </div>
  );
}

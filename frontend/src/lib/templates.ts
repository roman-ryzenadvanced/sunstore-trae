export interface TemplateProduct {
  title: string
  slug: string
  description: string
  price: number
  oldPrice: number
  stock: number
  category: string
  featured: boolean
  specs: Record<string, string>
}

export interface StoreTemplate {
  id: string
  label: string
  emoji: string
  primaryColor: string
  heroTitle: string
  heroSubtitle: string
  suggestedName: string
  suggestedTagline: string
  suggestedCategories: string[]
  sampleProducts: TemplateProduct[]
  dealBadge: string
  trustBadges: string[]
}

export const templates: StoreTemplate[] = [
  // 1. SOLAR PANELS
  {
    id: 'solar-panels', label: 'Solar Panels', emoji: '☀️', primaryColor: '#eab308',
    heroTitle: 'Солнечная энергия для вашего дома',
    heroSubtitle: 'Профессиональные панели, инверторы и аккумуляторы от ведущих производителей с гарантией до 25 лет',
    suggestedName: 'СолнВольт', suggestedTagline: 'Профессиональные солнечные решения для дома и бизнеса',
    suggestedCategories: ['Солнечные панели', 'Инверторы', 'Аккумуляторы', 'Монтажные системы', 'Аксессуары'],
    dealBadge: 'Скидки до 20%',
    trustBadges: ['Гарантия 25 лет', 'Бесплатный монтаж', 'Возврат 30 дней', 'Сертифицировано'],
    sampleProducts: [
      { title: 'Монокристаллическая панель 400Вт', slug: 'mono-panel-400w', description: 'Высокоэффективная монокристаллическая панель с КПД 22.3%. Идеальна для жилых и коммерческих объектов.', price: 45000, oldPrice: 52000, stock: 25, category: 'Солнечные панели', featured: true, specs: { 'Мощность': '400 Вт', 'Тип': 'Монокристалл', 'КПД': '22.3%', 'Гарантия': '25 лет', 'Размер': '2100×1050 мм' } },
      { title: 'Поликристаллическая панель 300Вт', slug: 'poly-panel-300w', description: 'Бюджетная поликристаллическая панель для небольших установок.', price: 28000, oldPrice: 33000, stock: 40, category: 'Солнечные панели', featured: true, specs: { 'Мощность': '300 Вт', 'Тип': 'Поликристалл', 'КПД': '18.5%', 'Гарантия': '20 лет' } },
      { title: 'Гибридный инвертор 5 кВт', slug: 'hybrid-inverter-5kw', description: 'Инвертор с встроенным MPPT контроллером. Работает с сетью и автономно.', price: 85000, oldPrice: 95000, stock: 15, category: 'Инверторы', featured: true, specs: { 'Мощность': '5 кВт', 'Тип': 'Гибридный', 'Вход': '200-500В DC', 'КПД': '97.6%' } },
      { title: 'LiFePO4 аккумулятор 5.12 кВт⋅ч', slug: 'lifepo4-battery-5kwh', description: 'Литиево-железо-фосфатный аккумулятор с ресурсом 6000+ циклов.', price: 120000, oldPrice: 140000, stock: 10, category: 'Аккумуляторы', featured: true, specs: { 'Ёмкость': '5.12 кВт⋅ч', 'Химия': 'LiFePO4', 'Напряжение': '51.2В', 'Циклы': '6000+' } },
      { title: 'Крышная система монтажа на 4 панели', slug: 'roof-mount-4', description: 'Полный комплект для монтажа 4 панелей на крышу. Алюминий, крепёж включён.', price: 18000, oldPrice: 22000, stock: 30, category: 'Монтажные системы', featured: false, specs: { 'Панелей': '4 шт', 'Материал': 'Алюминий', 'Гарантия': '15 лет' } },
    ],
  },
  // 2. JEWELRY
  {
    id: 'jewelry', label: 'Jewelry', emoji: '💎', primaryColor: '#9333ea',
    heroTitle: 'Ювелирные украшения', heroSubtitle: 'Эксклюзивные кольца, подвески и серьги из золота и серебра с натуральными камнями',
    suggestedName: 'Золотая Нить', suggestedTagline: 'Ювелирные изделия ручной работы с доставкой по всей России',
    suggestedCategories: ['Кольца', 'Подвески', 'Серьги', 'Браслеты', 'Часы'],
    dealBadge: 'До -40%',
    trustBadges: ['Проба 585/925', 'Сертификат ГИИ', 'Гравировка бесплатно', 'Красивая упаковка'],
    sampleProducts: [
      { title: 'Кольцо из белого золота с бриллиантом 0.5ct', slug: 'gold-ring-diamond', description: 'Элегантное обручальное кольцо из белого золота 585 пробы с центральным бриллиантом.', price: 89000, oldPrice: 125000, stock: 8, category: 'Кольца', featured: true, specs: { 'Проба': '585', 'Вставка': 'Бриллиант 0.5ct', 'Вес': '3.2г', 'Размеры': '16-22' } },
      { title: 'Подвеска «Сердце» с рубином', slug: 'heart-pendant-ruby', description: 'Нежная подвеска в форме сердца с натуральным рубином на цепочке.', price: 34500, oldPrice: 42000, stock: 15, category: 'Подвески', featured: true, specs: { 'Металл': 'Красное золото', 'Камень': 'Рубин', 'Цепочка': '40 см', 'Проба': '585' } },
      { title: 'Серьги-подвески с жемчугом', slug: 'pearl-drop-earrings', description: 'Классические серьги с пресноводным жемчугом 8-9мм.', price: 15800, oldPrice: 19500, stock: 20, category: 'Серьги', featured: false, specs: { 'Материал': 'Серебро 925', 'Жемчуг': '8-9 мм', 'Замок': 'Английский' } },
      { title: 'Браслет «Теннис» с цирконами', slug: 'tennis-bracelet', description: 'Изысканный браслет с фианитами в pave-огранке.', price: 22700, oldPrice: 28000, stock: 12, category: 'Браслеты', featured: true, specs: { 'Металл': 'Белое золото', 'Камни': 'Фианиты 120 шт', 'Длина': '18 см', 'Вес': '5.8г' } },
      { title: 'Кварцевые часы с кожаным ремнём', slug: 'quartz-leather-watch', description: 'Минималистичные часы со стальным корпусом и итальянским ремнём.', price: 12400, oldPrice: 15500, stock: 25, category: 'Часы', featured: false, specs: { 'Механизм': 'Кварцевый', 'Корпус': 'Нержавеющая сталь', 'Водозащита': '30 м', 'Ремень': 'Кожа' } },
    ],
  },
  // 3. FASHION
  {
    id: 'fashion', label: 'Fashion', emoji: '👗', primaryColor: '#e11d48',
    heroTitle: 'Стильная одежда онлайн', heroSubtitle: 'Новая коллекция весна-лето 2026. Бесплатная доставка от 3000₽',
    suggestedName: 'ТрендМаркет', suggestedTagline: 'Мода и стиль с доставкой за 1-3 дня',
    suggestedCategories: ['Платья', 'Куртки', 'Обувь', 'Сумки', 'Аксессуары'],
    dealBadge: 'Новинка',
    trustBadges: ['Бесплатная доставка от 3000₽', 'Примерка 14 дней', 'Сезонные распродажи', 'Quick response'],
    sampleProducts: [
      { title: 'Шёлковое платье-макси «Вечер»', slug: 'silk-maxi-dress', description: 'Элегантное шёлковое платье макси-длины. Идеально для особых случаев.', price: 12800, oldPrice: 16500, stock: 15, category: 'Платья', featured: true, specs: { 'Материал': 'Шёлк', 'Размеры': 'S-XL', 'Цвет': 'Бордо', 'Длина': '140 см' } },
      { title: 'Кожаная куртка- косуха', slug: 'leather-biker-jacket', description: 'Классическая косуха из натуральной кожи. Утеплённая подкладка.', price: 24500, oldPrice: 29000, stock: 8, category: 'Куртки', featured: true, specs: { 'Материал': 'Натуральная кожа', 'Подкладка': 'Полиэстер', 'Размеры': 'M-3XL', 'Утеплитель': 'Тинсулейт' } },
      { title: 'Замшевые ботинки на каблуке 7 см', slug: 'suede-heel-boots', description: 'Элегантные замшевые ботинки с удобной колодкой.', price: 8900, oldPrice: 11200, stock: 20, category: 'Обувь', featured: false, specs: { 'Материал': 'Замша', 'Подошва': 'Резина', 'Каблук': '7 см', 'Размеры': '36-41' } },
      { title: 'Кожаная сумка «Бостон»', slug: 'leather-boston-bag', description: 'Вместительная сумка из мягкой кожи с множеством отделений.', price: 15700, oldPrice: 18900, stock: 12, category: 'Сумки', featured: true, specs: { 'Материал': 'Натуральная кожа', 'Объём': '20 л', 'Отделения': '5', 'Размер': '35×25×15 см' } },
      { title: 'Шерстяной шарф-снуд', slug: 'wool-scarf-cowl', description: 'Мягкий шарф-снуд из мериносовой шерсти.', price: 3200, oldPrice: 4000, stock: 50, category: 'Аксессуары', featured: false, specs: { 'Материал': 'Меринос 100%', 'Размер': 'один', 'Цвета': '8 вариантов' } },
    ],
  },
  // 4. ELECTRONICS
  {
    id: 'electronics', label: 'Electronics', emoji: '📱', primaryColor: '#0891b2',
    heroTitle: 'Электроника по лучшим ценам', heroSubtitle: 'Смартфоны, ноутбуки и аксессуары от официальных дилеров',
    suggestedName: 'ГаджетМастер', suggestedTagline: 'Техника и гаджеты с гарантией производителя',
    suggestedCategories: ['Смартфоны', 'Ноутбуки', 'Планшеты', 'Наушники', 'Аксессуары'],
    dealBadge: 'Хит продаж',
    trustBadges: ['Официальный дилер', 'Гарантия 1-3 года', 'Кредит 0%', 'Trade-in'],
    sampleProducts: [
      { title: 'Смартфон 128 ГБ, AMOLED 6.7"', slug: 'smartphone-128gb', description: 'Флагманский смартфон с отличной камерой и батареей 5000 мАч.', price: 54990, oldPrice: 64990, stock: 30, category: 'Смартфоны', featured: true, specs: { 'Экран': '6.7" AMOLED', 'Память': '128 ГБ', 'Батарея': '5000 мАч', 'Камера': '108 МП' } },
      { title: 'Ноутбук 15.6" IPS, 16 ГБ RAM', slug: 'laptop-15-16gb', description: 'Тонкий и мощный ноутбук для работы и учёбы.', price: 68900, oldPrice: 79900, stock: 12, category: 'Ноутбуки', featured: true, specs: { 'Экран': '15.6" IPS', 'Процессор': 'i5-13400H', 'RAM': '16 ГБ', 'SSD': '512 ГБ' } },
      { title: 'Планшет 10.4", 64 ГБ', slug: 'tablet-10-64gb', description: 'Компактный планшет для чтения, видео и работы.', price: 18900, oldPrice: 22900, stock: 18, category: 'Планшеты', featured: false, specs: { 'Экран': '10.4" IPS', 'Память': '64 ГБ', 'Батарея': '6000 мАч', 'Вес': '460 г' } },
      { title: 'Наушники с шумоподавлением', slug: 'anc-headphones', description: 'Полноразмерные наушники с активным шумоподавлением.', price: 7990, oldPrice: 9990, stock: 45, category: 'Наушники', featured: true, specs: { 'Тип': 'Полноразмерные', 'ANC': 'Да', 'Батарея': '30 часов', 'Bluetooth': '5.3' } },
      { title: 'Быстрое зарядное устройство 65Вт GaN', slug: 'gan-charger-65w', description: 'Компактное зарядное устройство с тремя портами.', price: 2490, oldPrice: 3200, stock: 80, category: 'Аксессуары', featured: false, specs: { 'Мощность': '65 Вт', 'Порты': 'USB-C×2, USB-A', 'Технология': 'GaN', 'Размер': '65×40 мм' } },
    ],
  },
  // 5. FOOD
  {
    id: 'food', label: 'Food', emoji: '🍕', primaryColor: '#dc2626',
    heroTitle: 'Деликатесы с доставкой', heroSubtitle: 'Чёрная икра, шоколад, кофе — отборные продукты от лучших производителей',
    suggestedName: 'ДеликатесНова', suggestedTagline: 'Премиальные продукты для гурманов с быстрой доставкой',
    suggestedCategories: ['Икра', 'Шоколад', 'Кофе', 'Мёд', 'Чай'],
    dealBadge: 'Подарочные наборы',
    trustBadges: ['Сертификат качества', 'Холодная доставка', 'Оплата при получении', 'Подарочная упаковка'],
    sampleProducts: [
      { title: 'Чёрная икра осётр 125 г', slug: 'black-caviar-125g', description: 'Натуральная чёрная икра осётровых рыб. Пастеризованная.', price: 8500, oldPrice: 9800, stock: 20, category: 'Икра', featured: true, specs: { 'Вид': 'Осётр', 'Масса нетто': '125 г', 'Упаковка': 'Стеклянная банка', 'Срок': '6 месяцев' } },
      { title: 'Шоколадные трюфели 24 шт.', slug: 'chocolate-truffles-24', description: 'Набор бельгийских трюфелей с различными начинками.', price: 3200, oldPrice: 3900, stock: 35, category: 'Шоколад', featured: true, specs: { 'Количество': '24 шт', 'Вес': '360 г', 'Какао': '72%', 'Начинки': '8 видов' } },
      { title: 'Кофе в зёрнах Эфиопия 1 кг', slug: 'ethiopia-coffee-1kg', description: 'Зерновой кофе из Эфиопии, средняя обжарка. Фруктовые ноты.', price: 2800, oldPrice: 3400, stock: 50, category: 'Кофе', featured: false, specs: { 'Происхождение': 'Эфиопия', 'Обжарка': 'Средняя', 'Сорт': 'Арабика', 'Вес': '1 кг' } },
      { title: 'Горный мёд с орехами 500 г', slug: 'mountain-honey-500g', description: 'Натуральный горный мёд с грецкими орехами. Башкирия.', price: 1900, oldPrice: 2300, stock: 40, category: 'Мёд', featured: false, specs: { 'Тип': 'Горный', 'Добавки': 'Грецкий орех', 'Масса': '500 г', 'Регион': 'Башкирия' } },
      { title: 'Чайный набор «Императорский» 6 сортов', slug: 'imperial-tea-set', description: 'Коллекционный набор из 6 сортов чая в подарочной коробке.', price: 4500, oldPrice: 5800, stock: 15, category: 'Чай', featured: true, specs: { 'Сортов': '6', 'Масса': '300 г', 'Упаковка': 'Подарочная', 'Происхождение': 'Цейлон, Китай, Индия' } },
    ],
  },
  // 6. BEAUTY
  {
    id: 'beauty', label: 'Beauty', emoji: '💄', primaryColor: '#db2777',
    heroTitle: 'Красота и уход', heroSubtitle: 'Профессиональная косметика, парфюмерия и уход за кожей и волосами',
    suggestedName: 'БьютиЛавка', suggestedTagline: 'Профессиональная косметика и парфюмерия с доставкой',
    suggestedCategories: ['Уход за кожей', 'Парфюмерия', 'Макияж', 'Уход за волосами', 'Ногтевая косметика'],
    dealBadge: 'Бесплатный подарок',
    trustBadges: ['Оригинал 100%', 'Пробы бесплатно', 'Дисконтная программа', 'Экспертная консультация'],
    sampleProducts: [
      { title: 'Сыворотка с гиалуроновой кислотой 30 мл', slug: 'hyaluronic-serum-30ml', description: 'Увлажняющая сыворотка с тройной молекулярной массой гиалуроновой кислоты.', price: 2400, oldPrice: 3100, stock: 35, category: 'Уход за кожей', featured: true, specs: { 'Объём': '30 мл', 'Актив': 'Гиалуроновая кислота', 'Тип кожи': 'Все типы', 'Курс': '3 флакона' } },
      { title: 'Парфюмерная вода «Цветочный букет» 50 мл', slug: 'floral-perfume-50ml', description: 'Утончённый женский аромат с нотами розы, пионии и мускуса.', price: 5800, oldPrice: 7200, stock: 18, category: 'Парфюмерия', featured: true, specs: { 'Объём': '50 мл', 'Аромат': 'Цветочный', 'Ноты': 'Роза, пиония, мускус', 'Стойкость': '8 часов' } },
      { title: 'Тушь для ресниц «Объёмная»', slug: 'volume-mascara', description: 'Суперобъёмная тушь со специальной щёточкой для разделения ресниц.', price: 980, oldPrice: 1200, stock: 60, category: 'Макияж', featured: false, specs: { 'Эффект': 'Объём + длина', 'Водостойкая': 'Да', 'Снятие': 'Тёплой водой', 'Объём': '12 мл' } },
      { title: 'Маска для волос кератиновая 500 мл', slug: 'keratin-hair-mask', description: 'Восстанавливающая кератиновая маска для повреждённых волос.', price: 1850, oldPrice: 2300, stock: 25, category: 'Уход за волосами', featured: false, specs: { 'Объём': '500 мл', 'Актив': 'Кератин', 'Тип волос': 'Повреждённые', 'Применение': '2-3 раза в неделю' } },
      { title: 'Набор гель-лаков «Летняя палитра» 6 шт', slug: 'gel-polish-summer', description: 'Летняя коллекция гель-лаков со стразами.', price: 2100, oldPrice: 2800, stock: 22, category: 'Ногтевая косметика', featured: true, specs: { 'Количество': '6 шт', 'Объём': '10 мл/шт', 'Держимость': '3 недели', 'Сушка': 'LED/УФ' } },
    ],
  },
  // 7. SPORTS
  {
    id: 'sports', label: 'Sports', emoji: '⚽', primaryColor: '#16a34a',
    heroTitle: 'Спортивный инвентарь', heroSubtitle: 'Всё для фитнеса, бега и командных видов спорта. Профессиональное оборудование.',
    suggestedName: 'СпортМастер', suggestedTagline: 'Профессиональный спортинвентарь для каждого',
    suggestedCategories: ['Фитнес', 'Бег', 'Футбол', 'Единоборства', 'Туризм'],
    dealBadge: 'Сезонная распродажа',
    trustBadges: ['Профессиональное качество', 'Гарантия 2 года', 'Быстрая доставка', 'Консультация тренера'],
    sampleProducts: [
      { title: 'Гантели разборные 20 кг', slug: 'adjustable-dumbbells-20kg', description: 'Универсальные разборные гантели с удобным замком.', price: 6500, oldPrice: 7900, stock: 20, category: 'Фитнес', featured: true, specs: { 'Вес': '20 кг (пара)', 'Материал': 'Чугун + неопрен', 'Замок': 'Звёздочка', 'Гриф': 'Хромированный' } },
      { title: 'Беговые кроссовки с амортизацией', slug: 'running-shoes-cushion', description: 'Лёгкие кроссовки с пенной амортизацией для ежедневных пробежек.', price: 7800, oldPrice: 9500, stock: 30, category: 'Бег', featured: true, specs: { 'Вес': '280 г', 'Амортизация': 'Пена EVA', 'Подошва': 'Резина', 'Размеры': '39-46' } },
      { title: 'Футбольный мяч FIFA Quality', slug: 'fifa-football', description: 'Матчевый мяч сертификации FIFA Quality Pro.', price: 4900, oldPrice: 5900, stock: 15, category: 'Футбол', featured: false, specs: { 'Размер': '5', 'Сертификат': 'FIFA Quality', 'Материал': 'Полиуретан', 'Камера': 'Латексная' } },
      { title: 'Набор для бокса 6 в 1', slug: 'boxing-set-6in1', description: 'Перчатки 12oz, бинты, шлем,_skip rope, тренировочные перчатки, мешок.', price: 8900, oldPrice: 11200, stock: 10, category: 'Единоборства', featured: true, specs: { 'Комплект': '6 предметов', 'Перчатки': '12 oz', 'Шлем': 'Взрослый', 'Материал': 'Натуральная кожа' } },
      { title: 'Трекинговые палки телескопические', slug: 'trekking-poles', description: 'Лёгкие алюминиевые палки с пробковыми ручками и антишоком.', price: 3200, oldPrice: 4000, stock: 25, category: 'Туризм', featured: false, specs: { 'Материал': 'Алюминий 7075', 'Длина': '65-135 см', 'Вес': '240 г/шт', 'Антишок': 'Да' } },
    ],
  },
  // 8. BOOKS
  {
    id: 'books', label: 'Books', emoji: '📚', primaryColor: '#78716c',
    heroTitle: 'Мир книг', heroSubtitle: 'Художественная литература, учебники, подарочные издания и канцелярия',
    suggestedName: 'Книжный Дом', suggestedTagline: 'Более 100 000 книг с быстрой доставкой по России',
    suggestedCategories: ['Художественная', 'Нон-фикшн', 'Учебники', 'Аудиокниги', 'Канцелярия'],
    dealBadge: '3 по цене 2',
    trustBadges: ['Более 100 000 названий', 'Доставка 1-5 дней', 'Подарочная упаковка', 'Электронные версии'],
    sampleProducts: [
      { title: '«Мастер и Маргарита» Булгаков, подарочное издание', slug: 'master-margarita-gift', description: 'Легендарный роман в кожаном переплёте с золотым тиснением.', price: 3800, oldPrice: 4500, stock: 50, category: 'Художественная', featured: true, specs: { 'Автор': 'М. Булгаков', 'Переплёт': 'Кожа', 'Страниц': '480', 'Формат': '84×108/32' } },
      { title: '«Атомные привычки» Джеймс Клир', slug: 'atomic-habits', description: 'Бестселлер о том, как построить хорошие привычки и избавиться от плохих.', price: 780, oldPrice: 950, stock: 100, category: 'Нон-фикшн', featured: true, specs: { 'Автор': 'Джеймс Клир', 'Страниц': '320', 'Переплёт': 'Мягкий', 'Язык': 'Русский' } },
      { title: 'Учебник высшей математики, 2 тома', slug: 'higher-math-textbook', description: 'Полный курс высшей математики для вузов. 2-е издание.', price: 2200, oldPrice: 2700, stock: 30, category: 'Учебники', featured: false, specs: { 'Томов': '2', 'Страниц': '960', 'Формат': '60×84/16', 'Год': '2025' } },
      { title: 'Аудиокнига «1984» Джордж Оруэлл', slug: 'audiobook-1984', description: 'Классика антиутопии. Читает профессиональный актёр.', price: 590, oldPrice: 750, stock: 200, category: 'Аудиокниги', featured: false, specs: { 'Автор': 'Джордж Оруэлл', 'Длительность': '12 ч 30 мин', 'Формат': 'MP3', 'Читает': 'Проф. актёр' } },
      { title: 'Набор перьевых ручек Parker 3 шт', slug: 'parker-pen-set', description: 'Подарочный набор перьевых ручек Parker в футляре.', price: 4500, oldPrice: 5500, stock: 12, category: 'Канцелярия', featured: true, specs: { 'Бренд': 'Parker', 'Количество': '3 шт', 'Футляр': 'Включён', 'Перо': 'Стальное, среднее' } },
    ],
  },
  // 9. HOME & GARDEN
  {
    id: 'home-garden', label: 'Home & Garden', emoji: '🏡', primaryColor: '#b45309',
    heroTitle: 'Уютный дом', heroSubtitle: 'Мебель, освещение, декор и всё для создания комфортного интерьера',
    suggestedName: 'ДомУют', suggestedTagline: 'Всё для красивого и уютного дома',
    suggestedCategories: ['Мебель', 'Освещение', 'Декор', 'Кухня', 'Текстиль'],
    dealBadge: 'Скидки на мебель',
    trustBadges: ['Собственная доставка', 'Сборка бесплатно', 'Гарантия 5 лет', '3D-визуализация'],
    sampleProducts: [
      { title: 'Диван «Кофи» прямой 3-местный', slug: 'cofi-sofa', description: 'Мягкий и стильный диван с обивкой из рогожки и подушками.', price: 42000, oldPrice: 52000, stock: 5, category: 'Мебель', featured: true, specs: { 'Ш×Г×В': '220×90×85 см', 'Материал': 'Рогожка', 'Наполнитель': 'ППУ', 'Сборка': '5 минут' } },
      { title: 'Настольная лампа «Арт-Деко»', slug: 'art-deco-lamp', description: 'Элегантная настольная лампа в стиле арт-деко с абажуром из стекла.', price: 5900, oldPrice: 7200, stock: 15, category: 'Освещение', featured: false, specs: { 'Высота': '45 см', 'Патрон': 'E27', 'Мощность': 'до 60 Вт', 'Абажур': 'Стекло' } },
      { title: 'Набор декоративных подушек 4 шт', slug: 'decorative-pillows', description: 'Набор из 4 подушек в разных фактурах.', price: 3800, oldPrice: 4800, stock: 20, category: 'Декор', featured: true, specs: { 'Количество': '4 шт', 'Размер': '45×45 см', 'Наполнитель': 'Холлофайбер', 'Чехлы': 'Сняваемые' } },
      { title: 'Набор кухонной утвари из 12 предметов', slug: 'kitchen-utensil-set', description: 'Набор качественных кухонных инструментов из нержавеющей стали.', price: 4500, oldPrice: 5800, stock: 25, category: 'Кухня', featured: false, specs: { 'Предметов': '12', 'Материал': 'Нерж. сталь', 'Держки': 'Силикон', 'Мытьё': 'Посудомойка' } },
      { title: 'Постельное бельё сатин «Роза»', slug: 'satin-bedding-rose', description: 'Роскошное постельное бельё из сатина с цветочным принтом.', price: 6500, oldPrice: 8000, stock: 18, category: 'Текстиль', featured: false, specs: { 'Материал': 'Сатин', 'Размер': '200×220 см', 'Комплект': '2+1+2', 'Упаковка': 'Подарочная' } },
    ],
  },
  // 10. PETS
  {
    id: 'pets', label: 'Pets', emoji: '🐾', primaryColor: '#c2410c',
    heroTitle: 'Всё для ваших питомцев', heroSubtitle: 'Корма, игрушки, аксессуары и средства гигиены для собак и кошек',
    suggestedName: 'ХвостатыйМагазин', suggestedTagline: 'Всё для здоровья и радости ваших питомцев',
    suggestedCategories: ['Корм для собак', 'Корм для кошек', 'Игрушки', 'Лежанки', 'Груминг'],
    dealBadge: 'Новая коллекция',
    trustBadges: ['Ветеринарная сертификация', 'Подписка на корм', 'Бонусная программа', 'Консультация ветеринара'],
    sampleProducts: [
      { title: 'Сухой корм для собак премиум 15 кг', slug: 'premium-dog-food-15kg', description: 'Премиальный корм с курицей и рисом для взрослых собак.', price: 4200, oldPrice: 4900, stock: 40, category: 'Корм для собак', featured: true, specs: { 'Вес': '15 кг', 'Вкус': 'Курица и рис', 'Класс': 'Премиум', 'Возраст': 'Взрослые' } },
      { title: 'Кошачий наполнитель силикагелевый 5 л', slug: 'silica-cat-litter-5l', description: 'Высокоэффективный силикагелевый наполнитель без пыли и запаха.', price: 890, oldPrice: 1100, stock: 60, category: 'Корм для кошек', featured: false, specs: { 'Объём': '5 л', 'Тип': 'Силикагель', 'Впитываемость': '3 недели', 'Пыль': 'Нет' } },
      { title: 'Интерактивная игрушка для кошек', slug: 'interactive-cat-toy', description: 'Умная игрушка с лазерной указкой и автоматическим режимом.', price: 2500, oldPrice: 3200, stock: 30, category: 'Игрушки', featured: true, specs: { 'Тип': 'Автоматическая', 'Питание': 'USB-C', 'Режимы': '3', 'Материал': 'ABS-пластик' } },
      { title: 'Ортопедическая лежанка для собак L', slug: 'orthopedic-dog-bed-l', description: 'Ортопедическая лежанка с матрасом из.memory foam для крупных собак.', price: 5900, oldPrice: 7200, stock: 12, category: 'Лежанки', featured: false, specs: { 'Размер': '110×80 см', 'Матрас': 'Memory foam', 'Чехол': 'Сняваемый', 'Для пород': '25-50 кг' } },
      { title: 'Набор для груминга собак 5 в 1', slug: 'dog-grooming-kit', description: 'Полный набор: ножницы, когтерезка, щётка, расчёска, фурминатор.', price: 3200, oldPrice: 4000, stock: 20, category: 'Груминг', featured: true, specs: { 'Предметов': '5', 'Материал': 'Нерж. сталь', 'Кейс': 'Включён', 'Для': 'Собак' } },
    ],
  },
  // 11. AUTOMOTIVE
  {
    id: 'automotive', label: 'Automotive', emoji: '🚗', primaryColor: '#1e40af',
    heroTitle: 'Автомобильный магазин', heroSubtitle: 'Шины, масла, запчасти и аксессуары для вашего автомобиля',
    suggestedName: 'АвтоМаркет', suggestedTagline: 'Запчасти и аксессуары с быстрой доставкой по России',
    suggestedCategories: ['Шины', 'Масла', 'Запчасти', 'Аксессуары', 'Инструменты'],
    dealBadge: 'Сезонная смена шин',
    trustBadges: ['Оригинальные запчасти', 'Подбор по VIN', 'Гарантия качества', 'Установка бесплатно'],
    sampleProducts: [
      { title: 'Летние шины 205/55 R16 91V', slug: 'summer-tires-205-55-r16', description: 'Качественные летние шины с отличным сцеплением на мокрой дороге.', price: 5800, oldPrice: 6900, stock: 40, category: 'Шины', featured: true, specs: { 'Размер': '205/55 R16', 'Индекс': '91V', 'Сезон': 'Летние', 'Рисунок': 'Направленный' } },
      { title: 'Моторное масло 5W-40 синтетика 4 л', slug: 'synthetic-oil-5w40', description: 'Полносинтетическое моторное масло для бензиновых двигателей.', price: 2800, oldPrice: 3400, stock: 60, category: 'Масла', featured: false, specs: { 'Вязкость': '5W-40', 'Тип': 'Синтетика', 'Объём': '4 л', 'Допуск': 'API SN Plus' } },
      { title: 'Тормозные колодки передние (комплект)', slug: 'brake-pads-front', description: 'Передние тормозные колодки с низким уровнем шума.', price: 3500, oldPrice: 4200, stock: 25, category: 'Запчасти', featured: true, specs: { 'Тип': 'Передние', 'Материал': 'Керамический', 'Износ': '40 000 км', 'Комплект': '4 шт' } },
      { title: 'Видеорегистратор 4K с GPS', slug: 'dashcam-4k-gps', description: 'Видеорегистратор с разрешением 4K, GPS и ночным режимом.', price: 6900, oldPrice: 8500, stock: 20, category: 'Аксессуары', featured: true, specs: { 'Разрешение': '4K', 'Угол обзора': '170°', 'GPS': 'Встроенный', 'Экран': '2.5"' } },
      { title: 'Набор автомобильных ключей 11 в 1', slug: 'car-key-set', description: 'Универсальный набор ключей для самостоятельного ремонта авто.', price: 4500, oldPrice: 5500, stock: 18, category: 'Инструменты', featured: false, specs: { 'Предметов': '11', 'Кейс': 'Пластиковый', 'Материал': 'Chrome Vanadium', 'Гарантия': '1 год' } },
    ],
  },
  // 12. MUSIC
  {
    id: 'music', label: 'Music', emoji: '🎵', primaryColor: '#7e22ce',
    heroTitle: 'Мир музыки', heroSubtitle: 'Гитары, клавишные, студийное оборудование и аудиосистемы',
    suggestedName: 'ЗвукМастер', suggestedTagline: 'Музыкальные инструменты и звукотехника',
    suggestedCategories: ['Гитары', 'Клавишные', 'Наушники', 'Микрофоны', 'Акустика'],
    dealBadge: 'Студийное оборудование',
    trustBadges: ['Проверка перед отправкой', 'Настройка included', 'Гарантия 3 года', 'Trade-in'],
    sampleProducts: [
      { title: 'Акустическая гитара Western Cutaway', slug: 'acoustic-guitar-western', description: 'Красивая акустическая гитара с обрезанным корпусом и встроенным пикапом.', price: 18500, oldPrice: 22000, stock: 8, category: 'Гитары', featured: true, specs: { 'Топ': 'Ель', 'Обечайка': 'Палисандр', 'Дека': '40"', 'Пикап': 'B-Band' } },
      { title: 'Цифровое пианино 88 клавиш', slug: 'digital-piano-88', description: 'Полноразмерное цифровое пианино с взвешенными клавишами и 128 голосами.', price: 35000, oldPrice: 42000, stock: 5, category: 'Клавишные', featured: true, specs: { 'Клавиш': '88 взвешенных', 'Голосов': '128', 'Полифония': '256', 'Педали': '3' } },
      { title: 'Студийные наушники закрытого типа', slug: 'studio-headphones-closed', description: 'Профессиональные студийные наушники с плоским АЧХ.', price: 6800, oldPrice: 8200, stock: 15, category: 'Наушники', featured: false, specs: { 'Тип': 'Закрытый', 'Импеданс': '250 Ом', 'Частоты': '5-30000 Гц', 'Кабель': 'Съёмный 3м' } },
      { title: 'Конденсаторный микрофон для вокала', slug: 'condenser-vocal-mic', description: 'Многоцелевой микрофон с тёплым звучанием и низким уровнем шума.', price: 8900, oldPrice: 10500, stock: 12, category: 'Микрофоны', featured: true, specs: { 'Тип': 'Конденсаторный', 'Паттерн': 'Кардиоидный', 'Частоты': '20-20000 Гц', 'Чувствительность': '-36 дБ' } },
      { title: 'Активная акустика 5" студийный монитор (пара)', slug: 'studio-monitor-5inch-pair', description: 'Пара студийных мониторов для точного мониторинга.', price: 22000, oldPrice: 26000, stock: 6, category: 'Акустика', featured: false, specs: { 'Драйвер': '5" + 1"', 'Мощность': '50 Вт', 'Частоты': '52-30000 Гц', 'Входы': 'XLR, TRS, RCA' } },
    ],
  },
  // 13. ART
  {
    id: 'art', label: 'Art', emoji: '🎨', primaryColor: '#991b1b',
    heroTitle: 'Творчество без границ', heroSubtitle: 'Холсты, краски, кисти, мольберты и печатная графика',
    suggestedName: 'АртМагазин', suggestedTagline: 'Материалы для творчества и изобразительного искусства',
    suggestedCategories: ['Холсты и бумага', 'Краски', 'Кисти', 'Мольберты', 'Графика'],
    dealBadge: 'Наборы для начинающих',
    trustBadges: ['Профессиональные материалы', 'Быстрая доставка', 'Грамотная упаковка', 'Скидки для студентов'],
    sampleProducts: [
      { title: 'Холст натуральный льняной 80×120 см', slug: 'linen-canvas-80x120', description: 'Профессиональный натуральный льняной холст на подрамнике.', price: 4800, oldPrice: 5600, stock: 15, category: 'Холсты и бумага', featured: true, specs: { 'Размер': '80×120 см', 'Материал': 'Лён натуральный', 'Грунт': 'Без грунта', 'Плотность': '300 г/м²' } },
      { title: 'Набор масляных красок «Классика» 24 цвета', slug: 'oil-paint-set-24', description: 'Набор профессиональных масляных красок в тюбиках по 37 мл.', price: 5200, oldPrice: 6400, stock: 20, category: 'Краски', featured: true, specs: { 'Цветов': '24', 'Объём': '37 мл/тюбик', 'Пигмент': 'Высококонцентрированный', 'Светостойкость': '★★★★★' } },
      { title: 'Набор кистей колонок 12 шт', slug: 'kolinsky-brush-set', description: 'Профессиональные кисти из колонка в наборе из 12 размеров.', price: 3800, oldPrice: 4500, stock: 18, category: 'Кисти', featured: false, specs: { 'Волос': 'Колонок', 'Набор': '12 размеров', 'Ручка': 'Дерево', 'Формат': 'Круглые' } },
      { title: 'Мольберт настольный Х-образный', slug: 'x-easel-tabletop', description: 'Лёгкий складной мольберт для настольной работы.', price: 2900, oldPrice: 3500, stock: 10, category: 'Мольберты', featured: false, specs: { 'Тип': 'Х-образный', 'Макс. высота': '70 см', 'Макс. холст': '60 см', 'Материал': 'Бук' } },
      { title: 'Набор акварельных красок 48 цветов', slug: 'watercolor-set-48', description: 'Полный набор акварельных красок в кассетах.', price: 4200, oldPrice: 5100, stock: 25, category: 'Краски', featured: true, specs: { 'Цветов': '48', 'Формат': 'Кассета', 'Пигмент': 'Высокий', 'Светостойкость': '★★★★' } },
    ],
  },
  // 14. TOYS
  {
    id: 'toys', label: 'Toys', emoji: '🧸', primaryColor: '#0e7490',
    heroTitle: 'Игрушки для детей', heroSubtitle: 'Развивающие игры, конструкторы, куклы и игрушки на свежем воздухе',
    suggestedName: 'ИгрушкинДом', suggestedTagline: 'Радость для каждого ребёнка',
    suggestedCategories: ['Настольные игры', 'Конструкторы', 'Куклы', 'Образование', 'Уличные'],
    dealBadge: 'Подарки к празднику',
    trustBadges: ['Сертификат безопасности', 'Возрастная маркировка', 'Подарочная упаковка', 'Быстрая доставка'],
    sampleProducts: [
      { title: 'Настольная игра «Монополия: Россия»', slug: 'monopoly-russia', description: 'Классическая экономическая игра с российскими городами и достопримечательностями.', price: 2900, oldPrice: 3500, stock: 30, category: 'Настольные игры', featured: true, specs: { 'Игроков': '2-6', 'Возраст': '8+', 'Время': '60-180 мин', 'Версия': 'Россия' } },
      { title: 'Конструктор техник 1500 деталей', slug: 'technic-set-1500', description: 'Большой конструктор с мотором и деталями для сложных моделей.', price: 8500, oldPrice: 9900, stock: 15, category: 'Конструкторы', featured: true, specs: { 'Деталей': '1500', 'Мотор': 'Да', 'Возраст': '9+', 'Совместимость': 'Универсальная' } },
      { title: 'Интерактивная кукла с голосом', slug: 'interactive-doll-voice', description: 'Кукла говорит 100+ фраз, открывает глаза и двигается.', price: 4500, oldPrice: 5400, stock: 20, category: 'Куклы', featured: false, specs: { 'Рост': '42 см', 'Функций': '100+', 'Питание': '3×ААА', 'Возраст': '3+' } },
      { title: 'Набор «Юный химик» 50 опытов', slug: 'young-chemist-50', description: 'Безопасный набор для проведения 50 химических опытов дома.', price: 3200, oldPrice: 3800, stock: 25, category: 'Образование', featured: true, specs: { 'Опытов': '50', 'Возраст': '10+', 'Безопасность': 'Сертифицировано', 'Инструкция': 'Цветная' } },
      { title: 'Палатка-домик для двора', slug: 'play-tent-outdoor', description: 'Яркая палатка-домик для игр на свежем воздухе.', price: 3800, oldPrice: 4500, stock: 18, category: 'Уличные', featured: false, specs: { 'Размер': '120×120 см', 'Материал': 'Полиэстер', 'Сборка': '10 минут', 'Возраст': '3+' } },
    ],
  },
  // 15. HEALTH
  {
    id: 'health', label: 'Health', emoji: '💊', primaryColor: '#059669',
    heroTitle: 'Здоровье и wellness', heroSubtitle: 'Витамины, БАДы, медицинские приборы и средства для здорового образа жизни',
    suggestedName: 'ЗдравМаркет', suggestedTagline: 'Всё для вашего здоровья с доставкой на дом',
    suggestedCategories: ['Витамины', 'БАДы', 'Медтехника', 'Фитнес', 'Ароматерапия'],
    dealBadge: 'Здоровый образ жизни',
    trustBadges: ['Сертификаты GMP', 'Рекомендации врачей', 'Дисконтная программа', 'Анонимная доставка'],
    sampleProducts: [
      { title: 'Витамин D3 5000 МЕ, 120 капсул', slug: 'vitamin-d3-5000', description: 'Высокодозированный витамин D3 для поддержки иммунитета и костей.', price: 980, oldPrice: 1200, stock: 80, category: 'Витамины', featured: true, specs: { 'Дозировка': '5000 МЕ', 'Форма': 'Капсулы', 'Курс': '120 дней', 'Производство': 'Россия' } },
      { title: 'Омега-3 рыбий жир 1000 мг 90 капсул', slug: 'omega3-fish-oil', description: 'Высокоочищенный рыбий жир с высоким содержанием EPA и DHA.', price: 1200, oldPrice: 1500, stock: 60, category: 'БАДы', featured: true, specs: { 'Омега-3': '1000 мг', 'EPA': '330 мг', 'DHA': '220 мг', 'Капсул': '90' } },
      { title: 'Электронный тонометр на запястье', slug: 'wrist-blood-pressure', description: 'Компактный автоматический тонометр с памятью на 120 измерений.', price: 3900, oldPrice: 4800, stock: 15, category: 'Медтехника', featured: true, specs: { 'Тип': 'На запястье', 'Автоматический': 'Да', 'Память': '120 записей', 'Питание': '2×ААА' } },
      { title: 'Фитнес-браслет с пульсометром', slug: 'fitness-band-hr', description: 'Умный браслет с шагомером, пульсометром и мониторингом сна.', price: 2900, oldPrice: 3500, stock: 35, category: 'Фитнес', featured: false, specs: { 'Экран': 'OLED 0.96"', 'Водозащита': 'IP67', 'Батарея': '14 дней', 'Датчики': 'Пульс, акселерометр' } },
      { title: 'Набор эфирных масел «Релакс» 6 шт', slug: 'essential-oil-relax', description: 'Набор масел лаванды, мяты, эвкалипта, чайного дерева, лимона и апельсина.', price: 1800, oldPrice: 2200, stock: 30, category: 'Ароматерапия', featured: false, specs: { 'Масел': '6', 'Объём': '10 мл/каждое', '100% натуральные': 'Да', 'Упаковка': 'Подарочная' } },
    ],
  },
  // 16. TRAVEL
  {
    id: 'travel', label: 'Travel', emoji: '✈️', primaryColor: '#0369a1',
    heroTitle: 'Путешествия комфортно', heroSubtitle: 'Чемоданы, рюкзаки, дорожные наборы и аксессуары для путешественников',
    suggestedName: 'ТревелШоп', suggestedTagline: 'Всё для комфортных путешествий',
    suggestedCategories: ['Чемоданы', 'Рюкзаки', 'Дорожные наборы', 'Подушки', 'Адаптеры'],
    dealBadge: 'Перед отпуском',
    trustBadges: ['Гарантия 5 лет', 'Бесплатная доставка', 'Тест в магазине', 'Ремонт за 24ч'],
    sampleProducts: [
      { title: 'Чемодан на колёсиках 28" поликарбонат', slug: 'hardshell-suitcase-28', description: 'Лёгкий и прочный чемодан из поликарбоната с TSA-замком.', price: 8900, oldPrice: 10800, stock: 20, category: 'Чемоданы', featured: true, specs: { 'Размер': '28"', 'Материал': 'Поликарбонат', 'Вес': '3.8 кг', 'Замок': 'TSA-комбинация' } },
      { title: 'Городской рюкзак 25L с USB-портом', slug: 'urban-backpack-25l', description: 'Стильный рюкзак для ноутбука до 15.6" с зарядным портом.', price: 3900, oldPrice: 4800, stock: 30, category: 'Рюкзаки', featured: true, specs: { 'Объём': '25 л', 'Ноутбук': 'до 15.6"', 'USB': 'Встроенный', 'Водозащита': 'IPX4' } },
      { title: 'Дорожный набор для туалетных принадлежностей', slug: 'travel-toiletry-kit', description: 'Водонепроницаемый подвесной органайзер для туалетных принадлежностей.', price: 1900, oldPrice: 2400, stock: 40, category: 'Дорожные наборы', featured: false, specs: { 'Отделений': '4', 'Материал': 'Полиэстер', 'Водозащита': 'IPX5', 'Крючок': 'Встроенный' } },
      { title: 'Надувная подушка для шеи с поддержкой', slug: 'inflatable-neck-pillow', description: 'Эргономичная подушка для комфорта в самолёте, поезде или автобусе.', price: 1200, oldPrice: 1600, stock: 50, category: 'Подушки', featured: false, specs: { 'Тип': 'Надувная', 'Память': 'Foam', 'Чехол': 'Вельвет', 'Вес': '180 г' } },
      { title: 'Универсальный путевой адаптер 4 порта USB', slug: 'universal-travel-adapter', description: 'Работает в 200+ странах. 4 USB-порта и USB-C.', price: 2500, oldPrice: 3100, stock: 25, category: 'Адаптеры', featured: true, specs: { 'Стран': '200+', 'USB': '4×USB-A + 1×USB-C', 'Мощность': '65 Вт', 'Защита': 'От перенапряжения' } },
    ],
  },
  // 17. TOOLS
  {
    id: 'tools', label: 'Tools', emoji: '🔧', primaryColor: '#a16207',
    heroTitle: 'Инструменты профессионала', heroSubtitle: 'Электроинструмент, ручной инструмент и расходные материалы',
    suggestedName: 'МастерМагазин', suggestedTagline: 'Инструменты для профессионалов и домашних мастеров',
    suggestedCategories: ['Электроинструмент', 'Пилы', 'Ручной инструмент', 'Наборы', 'Средства защиты'],
    dealBadge: 'Хит продаж',
    trustBadges: ['Гарантия производителя', 'Сервисные центры', 'Кредит на покупку', 'Расходники в наличии'],
    sampleProducts: [
      { title: 'Ударная дрель-шуруповёр 18В', slug: 'impact-drill-18v', description: 'Мощная дрель-шуруповёр с ударным механизмом и 2 аккумуляторами.', price: 12500, oldPrice: 15000, stock: 10, category: 'Электроинструмент', featured: true, specs: { 'Напряжение': '18 В', 'Крутящий момент': '60 Нм', 'Аккумуляторы': '2×2 Ач', 'Удар': 'Да' } },
      { title: 'Дисковая пила 190 мм 1400 Вт', slug: 'circular-saw-190mm', description: 'Профессиональная дисковая пила с плавным пуском и лазерной указкой.', price: 9800, oldPrice: 11500, stock: 8, category: 'Пилы', featured: true, specs: { 'Диск': '190 мм', 'Мощность': '1400 Вт', 'Обороты': '4800 об/мин', 'Лазер': 'Да' } },
      { title: 'Набор ключей комбинированных 17 предметов', slug: 'combination-wrench-set', description: 'Полный набор ключей 6-32 мм из хром-ванадиевой стали.', price: 4200, oldPrice: 5200, stock: 15, category: 'Ручной инструмент', featured: false, specs: { 'Размеры': '6-32 мм', 'Ключей': '17', 'Материал': 'CrV', 'Кейс': 'Пластиковый' } },
      { title: 'Набор бит и насадок 150 в 1', slug: 'bit-set-150', description: 'Универсальный набор из 150 бит, насадок и аксессуаров.', price: 2800, oldPrice: 3400, stock: 25, category: 'Наборы', featured: false, specs: { 'Предметов': '150', 'Биты': 'PH, PZ, SL, TX, HEX', 'Магнитный': 'Да', 'Кейс': 'Металлический' } },
      { title: 'Защитные очки + перчатки + маска (набор)', slug: 'safety-kit-gloves-glasses', description: 'Комплект СИЗ: защитные очки, рабочие перчатки и респираторная маска.', price: 1500, oldPrice: 1900, stock: 40, category: 'Средства защиты', featured: false, specs: { 'Очки': 'ANSI Z87.1', 'Перчатки': 'Латекс, M', 'Маска': 'FFP2', 'Назначение': 'Универсальный' } },
    ],
  },
  // 18. GARDEN
  {
    id: 'garden', label: 'Garden', emoji: '🌱', primaryColor: '#15803d',
    heroTitle: 'Ваш сад и огород', heroSubtitle: 'Семена, грунт, горшки, садовый инвентарь и удобрения',
    suggestedName: 'ЗелёныйОгород', suggestedTagline: 'Всё для красивого сада и щедрого урожая',
    suggestedCategories: ['Семена', 'Грунты и удобрения', 'Горшки', 'Садовый инвентарь', 'Полив'],
    dealBadge: 'Весенний сезон',
    trustBadges: ['Сортовые семена', 'Гарантия всхожести', 'Агроном-консультант', 'Доставка в сезон'],
    sampleProducts: [
      { title: 'Набор семян томатов «Классика» 6 сортов', slug: 'tomato-seeds-classic', description: '6 проверенных сортов томатов для открытого грунта и теплицы.', price: 450, oldPrice: 580, stock: 80, category: 'Семена', featured: true, specs: { 'Сортов': '6', 'Всхожесть': '95%', 'Срок': 'до 2028', 'Упаковка': 'Двойная' } },
      { title: 'Грунт универсальный с биогумусом 50 л', slug: 'universal-soil-50l', description: 'Плодородный грунт на основе торфа с биогумусом и минеральными добавками.', price: 1200, oldPrice: 1500, stock: 30, category: 'Грунты и удобрения', featured: true, specs: { 'Объём': '50 л', 'Основа': 'Верховой торф', 'pH': '5.5-6.5', 'Добавки': 'Биогумус' } },
      { title: 'Кашпо для комнатных растений 25 см', slug: 'indoor-plant-pot-25', description: 'Керамическое кашпо с дренажным отверстием и поддоном.', price: 680, oldPrice: 850, stock: 50, category: 'Горшки', featured: false, specs: { 'Диаметр': '25 см', 'Высота': '22 см', 'Материал': 'Керамика', 'Поддон': 'Включён' } },
      { title: 'Садовый инвентарь 5 в 1', slug: 'garden-tool-5in1', description: 'Набор: лопата, грабли, мотыга, секатор, пульверизатор.', price: 3200, oldPrice: 4000, stock: 20, category: 'Садовый инвентарь', featured: true, specs: { 'Предметов': '5', 'Рукоятки': 'Алюминий', 'Материал': 'Сталь + пластик', 'Кейс': 'Включён' } },
      { title: 'Шланг садовый 25 м 1/2"', slug: 'garden-hose-25m', description: 'Усиленный садовый шланг 3-слойный, морозостойкий.', price: 2800, oldPrice: 3500, stock: 15, category: 'Полив', featured: false, specs: { 'Длина': '25 м', 'Диаметр': '1/2" (13 мм)', 'Слоёв': '3', 'Давление': 'до 20 атм' } },
    ],
  },
  // 19. BABY
  {
    id: 'baby', label: 'Baby', emoji: '🍼', primaryColor: '#c026d3',
    heroTitle: 'Всё для малыша', heroSubtitle: 'Коляски, автокресла, детское питание, одежда и игрушки',
    suggestedName: 'МалышМагазин', suggestedTagline: 'Безопасные и качественные товары для детей',
    suggestedCategories: ['Коляски', 'Автокресла', 'Питание', 'Одежда', 'Игрушки'],
    dealBadge: 'Подарки к рождению',
    trustBadges: ['Безопасные материалы', 'Сертификаты ЕС', 'Консультация педиатра', 'Подарочная упаковка'],
    sampleProducts: [
      { title: 'Коляска-трансформер 3 в 1', slug: 'stroller-transformer-3in1', description: 'Универсальная коляска: прогулочная, люлька и автокресло в одном.', price: 28000, oldPrice: 34000, stock: 8, category: 'Коляски', featured: true, specs: { 'Вес': '9.5 кг', 'Режимы': '3 в 1', 'Колёса': 'Резиновые', 'Возраст': '0-3 года' } },
      { title: 'Автокресло Isofix 0-36 кг', slug: 'isofix-car-seat', description: 'Универсальное автокресло с фиксациями ISOFIX и Top Tether.', price: 18000, oldPrice: 22000, stock: 12, category: 'Автокресла', featured: true, specs: { 'Фиксация': 'ISOFIX + Top Tether', 'Вес': '0-36 кг', 'Группа': '0/1/2/3', 'Стандарт': 'i-Size' } },
      { title: 'Стерилизатор для бутылочек', slug: 'bottle-sterilizer', description: 'Электрический стерилизатор с сушкой. Вмещает 6 бутылочек.', price: 4500, oldPrice: 5500, stock: 20, category: 'Питание', featured: false, specs: { 'Вместимость': '6 бутылочек', 'Время': '8 минут', 'Сушка': 'Да', 'Таймер': '24 часа' } },
      { title: 'Бодикомплект «Новорождённый» 5 предметов', slug: 'newborn-bodysuit-5pc', description: 'Набор из 5 боди из органического хлопка с кнопками.', price: 3800, oldPrice: 4500, stock: 25, category: 'Одежда', featured: false, specs: { 'Предметов': '5', 'Размер': '56-62', 'Материал': 'Орг. хлопок', 'Цвета': 'Пастельные' } },
      { title: 'Развивающий коврик с дугой', slug: 'play-mat-with-arch', description: 'Мягкий коврик с дугой, 5 подвесками и музыкальным модулем.', price: 5900, oldPrice: 7200, stock: 15, category: 'Игрушки', featured: true, specs: { 'Размер коврика': '130×100 см', 'Высота дуги': '60 см', 'Подвески': '5', 'Музыка': '8 мелодий' } },
    ],
  },
  // 20. GENERAL
  {
    id: 'general', label: 'General', emoji: '🛒', primaryColor: '#0f172a',
    heroTitle: 'Товары для дома и жизни', heroSubtitle: 'Широкий ассортимент товаров для повседневных нужд по выгодным ценам',
    suggestedName: 'МегаМаркет', suggestedTagline: 'Всё необходимое в одном магазине с быстрой доставкой',
    suggestedCategories: ['Бытовая техника', 'Товары для дома', 'Канцелярия', 'Спорт и отдых', 'Подарки'],
    dealBadge: 'Ежедневные скидки',
    trustBadges: ['Гарантия возврата', 'Быстрая доставка', 'Безопасная оплата', 'Служба поддержки 24/7'],
    sampleProducts: [
      { title: 'Робот-пылесос с базой', slug: 'robot-vacuum-with-base', description: 'Навигация по квартире, 自动式的 очистка, приложение для управления.', price: 25000, oldPrice: 30000, stock: 10, category: 'Бытовая техника', featured: true, specs: { 'Мощность': '4000 Па', 'Батарея': '5200 мАч', 'Навигация': 'LiDAR', 'Приложение': 'iOS/Android' } },
      { title: 'Набор полотенец из бамбука 4 шт', slug: 'bamboo-towels-set', description: 'Мягкие впитывающие полотенца из бамбукового волокна.', price: 2200, oldPrice: 2800, stock: 30, category: 'Товары для дома', featured: false, specs: { 'Количество': '4 шт', 'Материал': 'Бамбук', 'Размер': '70×140 см', 'Цвет': 'Натуральный' } },
      { title: 'Настольный органайзер для документов', slug: 'desk-document-organizer', description: 'Стильный органайзер с 5 отделениями и мобильной подставкой.', price: 1500, oldPrice: 1900, stock: 25, category: 'Канцелярия', featured: false, specs: { 'Отделений': '5', 'Материал': 'Фанера + металл', 'Размер': '35×24×12 см', 'Мобильная': 'Да' } },
      { title: 'Гамак с подставкой', slug: 'hammock-with-stand', description: 'Прочный гамак из парусины на металлической подставке.', price: 5800, oldPrice: 7200, stock: 12, category: 'Спорт и отдых', featured: true, specs: { 'Размер': '300×150 см', 'Нагрузка': '150 кг', 'Подставка': 'Стальная', 'Сборка': '15 минут' } },
      { title: 'Подарочный набор «Арома Свечи» 3 шт', slug: 'gift-aroma-candles', description: 'Набор ароматических свечей из соевого воска в подарочной коробке.', price: 2500, oldPrice: 3200, stock: 20, category: 'Подарки', featured: false, specs: { 'Свечей': '3', 'Время горения': '45 ч', 'Воск': 'Соевый', 'Ароматы': 'Лаванда, ваниль, цитрус' } },
    ],
  },
]

export function getTemplate(id: string): StoreTemplate | undefined {
  return templates.find((t) => t.id === id)
}

export function getTemplateProducts(templateId: string) {
  return getTemplate(templateId)?.sampleProducts || []
}
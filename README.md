# candles.mk

Онлајн продавница за мирисни свеќи. Статична страница (`index.html`) и една серверска функција (`api/order.js`) која за секоја нарачка праќа мејл преку Resend.

## Структура

```
index.html        страницата
img/              фотографии
api/order.js      прима нарачка и праќа мејл
package.json      Node 18+, без зависности
.env.example      потребни променливи
```

## 1. Resend API клуч

Мејловите за нарачки се праќаат преку [Resend](https://resend.com) (бесплатен план).

1. Регистрирај се на resend.com со contact.candles.mk@gmail.com.
2. API Keys → Create API Key (дозвола: Sending access) и копирај го клучот (`re_...`).
3. Клучот не го ставај во кодот, само во Vercel.

Без верификација на домен, Resend праќа од `onboarding@resend.dev` и само до мејлот со кој е отворена Resend сметката. За нарачки до тебе тоа е доволно.

## 2. Деплој на Vercel

1. На https://vercel.com/new избери го репото `candles-mk`. Framework Preset: **Other**. Build и Output полињата остави ги празни.
2. Во **Environment Variables** додај:

| Име | Вредност |
|---|---|
| `RESEND_API_KEY` | клучот од чекор 1 |
| `ORDER_TO` | `contact.candles.mk@gmail.com` |

3. Кликни Deploy.

Ако ги менуваш променливите подоцна: Deployments → … → **Redeploy**, за да важат.

**Подоцна (незадолжително):** кога candles.mk ќе работи, во Resend → Domains додај го candles.mk, внеси ги DNS записите и додај `ORDER_FROM` = `candles.mk <naracki@candles.mk>`. Тогаш може да се праќаат мејлови и до купувачите.

## 3. Домен candles.mk

Vercel → проект → Settings → Domains → додај `candles.mk` и `www.candles.mk`. Vercel ќе ти покаже DNS записи (A запис `76.76.21.21` за главниот домен и CNAME `cname.vercel-dns.com` за www) што ги внесуваш кај регистраторот на доменот.

## 4. Тест

Отвори ја страницата, додај свеќа, пополни ја формата и кликни „Нарачај“. Мејл со наслов „Нова нарачка CMK-…“ треба да стигне за неколку секунди.

Ако не стигне: Vercel → проект → Logs → барај `Email failed`. Најчеста причина е погрешен API клуч или неисправно име на променлива.

## Цени

Цената се пресметува и на серверот (во `api/order.js`, функцијата `priceFor`) за купувачот да не може да ја смени. Ако ги менуваш цените, смени ги и во `index.html` и во `api/order.js`.

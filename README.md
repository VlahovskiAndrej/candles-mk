# candles.mk

Онлајн продавница за мирисни свеќи. Статична страница (`index.html`) и една серверска функција (`api/order.js`) која за секоја нарачка праќа мејл преку Gmail.

## Структура

```
index.html        страницата
img/              фотографии
api/order.js      прима нарачка и праќа мејл
package.json      зависност: nodemailer
.env.example      потребни променливи
```

## 1. Gmail App Password

Gmail не дозволува праќање со обичната лозинка, потребна е „App Password“.

1. Најави се на candles.mk@gmail.com.
2. Вклучи 2-Step Verification: https://myaccount.google.com/security
3. Отвори https://myaccount.google.com/apppasswords, внеси име (на пр. `vercel`) и кликни Create.
4. Копирај ја лозинката од 16 букви (без празни места).

## 2. Деплој на Vercel

**Преку GitHub (препорачано)**

1. Качи ја папката во ново GitHub репо.
2. На https://vercel.com/new избери го репото. Framework Preset: **Other**. Build и Output полињата остави ги празни.
3. Пред Deploy, во **Environment Variables** додај:

| Име | Вредност |
|---|---|
| `GMAIL_USER` | `candles.mk@gmail.com` |
| `GMAIL_APP_PASSWORD` | лозинката од чекор 1 |
| `ORDER_TO` | адресата каде стигаат нарачките (може иста) |

4. Кликни Deploy.

**Преку CLI**

```bash
npm i -g vercel
cd candles-mk
vercel                 # прв деплој (preview)
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add ORDER_TO
vercel --prod
```

Ако ги менуваш променливите подоцна, направи нов деплој за да важат.

## 3. Домен candles.mk

Vercel → проект → Settings → Domains → додај `candles.mk` и `www.candles.mk`. Vercel ќе ти покаже DNS записи (A запис `76.76.21.21` за главниот домен и CNAME `cname.vercel-dns.com` за www) што ги внесуваш кај регистраторот на доменот.

## 4. Тест

Отвори ја страницата, додај свеќа, пополни ја формата и кликни „Нарачај“. Мејл со наслов „Нова нарачка CMK-…“ треба да стигне за неколку секунди.

Ако не стигне: Vercel → проект → Logs → барај `Email failed`. Најчеста причина е погрешна App Password или неисправно име на променлива.

## Цени

Цената се пресметува и на серверот (во `api/order.js`, функцијата `priceFor`) за купувачот да не може да ја смени. Ако ги менуваш цените, смени ги и во `index.html` и во `api/order.js`.

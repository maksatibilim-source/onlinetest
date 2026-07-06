# Online Test — Қабылдау емтиханы платформасы

5–9 сынып оқушыларына арналған онлайн тест жүйесі. Бір реттік кодпен кіру, анкета,
рандомизацияланған сұрақтар, жеңіл прокторинг және толық админ панель.

**Стек:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma (PostgreSQL) · KaTeX

---

## 🚀 Локал іске қосу

Postgres дерекқоры керек (локал орнатылған не Railway Postgres-тің публик URL-і).

```bash
# 1. Тәуелділіктерді орнату
npm install

# 2. .env файлын жасау да DATABASE_URL-ды Postgres жолыңызға қойыңыз
cp .env.example .env        # Windows: copy .env.example .env

# 3. Кестелерді құру
npm run db:push

# 4. Админді құру (демо сұрақ/код ЕНГІЗІЛМЕЙДІ)
npm run db:seed

# 5. Серверді қосу
npm run dev
```

Браузерде ашыңыз: **http://localhost:3000**

### Кіру
| Не | Мәні |
|---|---|
| Админ логин / құпия сөз | `.env` ішіндегі `ADMIN_USERNAME` / `ADMIN_PASSWORD` |
| Админ панель | http://localhost:3000/admin/login (немесе логин бетінің оң төменгі бұрышы) |

> Оқушы кодтарын админ панельдегі «Кодтар» бөлімінен генерациялайсыз.
> Сұрақтарды «Сұрақтар» бөлімінен қосасыз — базада алдын ала ешқандай сұрақ жоқ.

---

## 🧭 Жүйенің ағымы

**Оқушы:** `/` (4 таңбалы код) → `/questionnaire` (аты-жөні, сынып) →
`/test` (рандом сұрақтар + прокторинг) → `/result` (нәтиже).

**Админ:** `/admin` (басты бет) · `/admin/codes` (код беру) ·
`/admin/subjects` (пәндер) · `/admin/questions` (сұрақ енгізу + LaTeX превью) ·
`/admin/statistics` (нәтижелер мен нарушение кестесі).

---

## 🏛️ Архитектура

```
src/
├─ app/
│  ├─ page.tsx                 # 1-бет: логин (4 таңбалы код + жасырын админ сілтемесі)
│  ├─ questionnaire/page.tsx   # 2-бет: анкета
│  ├─ test/page.tsx            # 3-бет: тест ортасы (прокторинг қосулы)
│  ├─ result/page.tsx          # нәтиже
│  ├─ admin/
│  │  ├─ login/page.tsx        # админ логині (қорғалмаған)
│  │  └─ (protected)/          # сессиямен қорғалған аймақ (layout guard)
│  │     ├─ page.tsx           # dashboard
│  │     ├─ codes/ subjects/ questions/ statistics/
│  └─ api/                     # барлық REST endpoint-тер
├─ components/                 # MathContent, ProctoringWarning, admin/*
├─ hooks/useProctoring.ts      # вкладка ауысуын бақылау
└─ lib/                        # prisma, session, auth, utils
prisma/schema.prisma          # 7 модель
```

### Дерекқор модельдері
`User` (админ) · `Student` · `Subject` (сыныпқа бекітілген) · `Question`
(4 нұсқа + correctKey + LaTeX + сурет) · `Attempt` (тест сеансы + violations) ·
`Answer` (жеке жауап) · `OneTimeCode` (бір реттік код).

Ұпай **пәндер бойынша** `Answer → Question → Subject` арқылы есептеледі.

---

## 🔐 Қауіпсіздік ерекшеліктері

- **Дұрыс жауап кілті клиентке ешқашан жіберілмейді** — бағалау тек серверде (`/api/attempts/[id]/finish`).
- **Бір реттік код** тест «Аяқтау» батырмасы басылғанда `used` статусына өтеді (қайта қолдануға болмайды).
- Админ беттері **httpOnly қолтаңбаланған cookie** сессиясымен қорғалған.

---

## 🎓 Прокторинг

[`useProctoring`](src/hooks/useProctoring.ts) hook-ы `visibilitychange` (вкладка) және
`blur` (терезе) оқиғаларын тыңдайды. Әр бұзу серверге жазылып, оқушыға ескерту шығады.
`cooldownMs` арқылы қосарланған оқиғалар бір рет саналады.

---

## ⚙️ Пайдалы командалар

```bash
npm run dev          # dev сервер
npm run build        # продакшн build
npm run db:studio    # Prisma Studio (дерекқорды визуалды қарау)
npm run db:seed      # демо деректер
```

## ☁️ Railway-ге деплой (дерек тұрақты сақталады)

**Неге дерек өшпейді:** барлық дерек (админ, сұрақтар, оқушы нәтижелері)
бөлек **Postgres сервисінде** тұрады. Қосымша (app) кодын қанша қайта
деплойласаңыз да, Postgres сервисі қозғалмайды. Деплой кезінде тек
`prisma db push` схеманы қосымша (аддитивті) түрде синхрондайды — ешбір
дерек өшірілмейді (деструктивті өзгеріс болса, push қорғап, қатемен тоқтайды).

### Қадамдар

1. **GitHub репозиторийіне жүктеу**
   ```bash
   git push -u origin main   # репозиторий: maksatibilim-source/onlinetest
   ```

2. **Railway жобасы** → *New* → *Deploy from GitHub repo* → `onlinetest`-ті таңдаңыз.

3. **Postgres қосу:** сол жобада *New* → *Database* → *Add PostgreSQL*.

4. **Env айнымалылары** (app сервисі → *Variables*):
   | Айнымалы | Мәні |
   |---|---|
   | `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` (Railway референсі) |
   | `SESSION_SECRET` | ұзын кездейсоқ жол (`openssl rand -base64 32`) |
   | `ADMIN_USERNAME` | админ логині |
   | `ADMIN_PASSWORD` | күшті құпия сөз |

5. Railway автоматты build (`npm run build`) + start (`npm run start:prod`) жасайды.
   Старт кезінде кестелер құрылып, админ автоматты қосылады.

### 🖼️ Жүктелген суреттер де сақталуы үшін (міндетті емес)

Суреттер `public/uploads`-қа жазылады. Ол да сақталуы үшін app сервисіне
**Volume** қосыңыз: *Settings* → *Volumes* → mount path: `/app/public/uploads`.
(Балама: продакшнде S3 / Cloudinary қолдану.)

## 🔧 Кейін өзгеріс енгізгенде

```bash
git add . && git commit -m "..." && git push
```
Railway жаңа push-ты автоматты деплойлайды. **Дерекқор сол күйінде қалады.**
Схеманы өзгертсеңіз (жаңа өріс/модель), `db push` оны аддитивті қосады.

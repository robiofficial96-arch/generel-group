# MLM / Investment Software — Full Development Roadmap

---

## ০. Confirmed Decisions (Client/User থেকে Lock হয়ে গেছে)

1. **Matching Type — Exact Equal Match (Confirmed):**
   A=5L, B=3L হলে কোনো match হবে না, কারো wallet এ কিছু ক্রেডিট হবে না, শুধু দুই পাশের টাকা জমা (pending) থাকবে। B-তে আরও 2L যোগ হয়ে B=5L হলে তখনই A(5L)=B(5L) সমান হওয়ায় পুরো 5L ম্যাচ হবে এবং উভয় পাশ 0 হয়ে যাবে।

2. **Extra Volume Handling — Confirmed (Exact match rule থেকেই আসে):**
   A=5L, B=3L অবস্থায় কোনো commission নেই (flush না, ০ টাকাও credit না — শুধু wait)। B তে নতুন investment এসে exact 5L এ না পৌঁছানো পর্যন্ত কিছুই হবে না। B = 5L হলে তখনই পুরো 5L-5L ম্যাচ।

3. **Tree Placement — Confirmed:**
   User নিজেই Join করার সময় Left/Right side বেছে নেবে। একবার set হয়ে গেলে এটা **শুধুমাত্র Admin** পরিবর্তন করতে পারবে, user নিজে পরে আর change করতে পারবে না (admin panel এ "Change Placement" নামে একটা controlled action থাকবে, সাথে audit log)।

4. **ROI Credit Timeline — Confirmed:**
   Monthly ভিত্তিতে ROI জমা হবে (30 দিন পর পর, daily split না)। R-Wallet এ প্রতি মাসে ১ বার করে ক্রেডিট হবে, মোট ১৮ বার।

5. **Rank System — Binary (Left/Right Leg) Confirmed, সাব-পয়েন্ট বাকি:**
   - Rank 1 (Sr. Executive Officer): Left leg এ 10L + Right leg এ 10L sales volume লাগবে (ভলিউম ভিত্তিক)।
   - Rank 2+ ("2x Sr. Executive Officer"): এখানে ভলিউম না, বরং **মানুষ গোনা** হবে — Left leg এ ১ জন + Right leg এ ১ জন (মোট ২ জন) Sr. Executive Officer rank পেলেই পরের rank unlock, **নাকি** প্রতি পাশে ২ জন করে (মোট ৪ জন) লাগবে — এই উপ-প্রশ্নটা client থেকে এখনো confirm করা বাকি। (Rank module যেহেতু Phase 7 এ পরে implement হবে, তাই এটা এখনই lock করা জরুরি না)

---

## ১. Best Tech Stack (সুপারিশ)

| Layer | Recommendation | কেন |
|---|---|---|
| Frontend (Customer + Admin + Agent panel) | **Next.js (React) + TypeScript + TailwindCSS** | Fast dev, SEO না লাগলেও SSR/SSG flexibility, বড় ecosystem |
| Backend/API | **Next.js API routes / Node.js (Express or NestJS)** | একই language (TS) দিয়ে frontend+backend, team ছোট হলে overhead কম |
| Database | **PostgreSQL (via Supabase বা self-hosted)** | Strong relational integrity — wallet/ledger systemে এটা must, transaction safety (ACID) দরকার |
| ORM | **Prisma** | Type-safe queries, migration সহজ |
| Auth | **Supabase Auth / NextAuth** (Admin কন্ট্রোলড user creation হওয়ায় custom role-based auth লাগবে) |
| Background Jobs (ROI, Salary, Matching) | **Cron Job (node-cron / Supabase pg_cron) + Queue (BullMQ + Redis)** | ROI daily credit, rank salary monthly payout, matching triggers async এ চালানো দরকার যাতে race condition না হয় |
| Hosting | **VPS (Node backend) + Vercel (frontend)** অথবা পুরোটা একসাথে VPS/DigitalOcean/AWS এ | Financial app বলে pure serverless এ transaction-heavy logic রিস্কি, dedicated server/VPS ভালো |
| Payment Gateway | **bKash/Nagad/Rocket Merchant API (MFS) + Bank manual verification + Crypto (USDT TRC20) gateway** |

> সংক্ষেপে: **Next.js + PostgreSQL + Prisma + Redis(Queue) + VPS hosting** — এটাই standard, maintainable, ও scalable combination এই ধরনের wallet/MLM system এর জন্য।

---

## ২. Database Core Modules (উচ্চ-স্তরের Schema Plan)

```
users              (id, name, mobile, placement_left_id, placement_right_id, upline_id, status, rank_id)
wallets            (user_id, e_wallet, g_wallet, c_wallet, r_wallet, t_wallet)
investments        (id, user_id, slot_amount, invested_at, roi_months_paid, status)
investment_slots   (id, amount) -- 9 fixed slots
commissions        (id, user_id, from_investment_id, type[direct/team/matching], amount, created_at)
matching_ledger    (user_id, left_carry_balance, right_carry_balance, total_matched_volume)
roi_schedule       (investment_id, month_no, amount, paid_at, status)
withdrawals        (id, user_id, amount, fee, net_amount, channel[admin/agent/id-id], payout_method, status)
transfers          (id, from_user_id, to_user_id, amount, fee, created_at)
ranks              (id, name, qualification_amount, leadership_amount, salary_amount, salary_months, physical_reward)
rank_salaries      (user_id, rank_id, total_months, paid_months, is_lifetime)
deposits           (id, user_id, amount, method[bank/mfs/digital], status, proof_file)
admin_logs         (id, admin_id, action, target_user_id, created_at)
```

---

## ৩. Full Development Roadmap (Phase-wise)

### Phase 0 — Requirement Lock (1 সপ্তাহ)
- উপরের ৫টা clarification client থেকে confirm করা
- Full SRS (Software Requirement Spec) ডকুমেন্ট তৈরি ও sign-off

### Phase 1 — Core Setup (1-2 সপ্তাহ)
- Next.js + Prisma + PostgreSQL project setup
- Database schema তৈরি ও migration
- Auth system (Admin, Agent, Customer — role-based)
- Basic Admin panel: user create/edit (rename, password reset, mobile change — admin only যেভাবে note এ লেখা ছিল)

### Phase 2 — Wallet & Deposit System (1-2 সপ্তাহ)
- 5 wallets (E/G/C/R/T) implement
- Deposit flow (Bank/MFS/Digital) + Admin approval
- Wallet ledger/history page

### Phase 3 — Investment & Tree Placement (2 সপ্তাহ)
- 9 investment slots সেটআপ
- Tree placement logic (auto বা manual — Phase 0 এর সিদ্ধান্ত অনুযায়ী)
- Genealogy tree view (visual tree UI)

### Phase 4 — Commission Engine (2-3 সপ্তাহ) — সবচেয়ে গুরুত্বপূর্ণ অংশ
- Direct Referral Commission (6%) — instant trigger
- Team Matching Commission (5%) — exact/cascading logic অনুযায়ী (Phase 0 lock)
- Carry forward ledger system
- Queue/cron দিয়ে matching trigger যাতে race condition না হয়

### Phase 5 — ROI Engine (1-2 সপ্তাহ)
- Monthly/Daily ROI calculation cron job
- 18-month cycle tracking, শেষ মাসে rounding adjustment (11,111×18 = 1,99,998 সমস্যার সমাধান)
- R-Wallet auto-credit

### Phase 6 — Withdrawal System (1-2 সপ্তাহ)
- Withdraw request (Admin / Agent / ID-ID)
- 10% fee deduction logic
- Admin approval workflow + payout tracking

### Phase 7 — Rank & Rewards (পরে, যখন client confirm করবে) (2 সপ্তাহ)
- Rank qualification engine (leg-based)
- Auto salary cron (6 মাস, lifetime rank)
- Physical reward tracking (Pending → Approved → Delivered)

### Phase 8 — Testing & Security (1-2 সপ্তাহ)
- Financial calculation unit tests (সবচেয়ে জরুরি — টাকার হিসাবে ভুল হওয়া যাবে না)
- Load testing (অনেক user একসাথে invest করলে matching ঠিকমতো চলে কিনা)
- Admin audit logs, fraud detection basics

### Phase 9 — Launch
- Staging এ client demo
- Production deploy (VPS + domain + SSL)
- Monitoring (error tracking + wallet balance reconciliation report)

---

## ৪. মোট আনুমানিক সময়
সব মিলিয়ে single developer হলে ~**3-4 মাস**, 2-3 জনের ছোট team হলে ~**6-8 সপ্তাহ**।

---

## ৫. সবচেয়ে বেশি রিস্ক কোথায়
- **Commission/Matching logic** — এখানে bug হলে সরাসরি টাকার ক্ষতি, তাই এটা সবচেয়ে বেশি টেস্ট করতে হবে।
- **Concurrency** — একসাথে অনেক ইনভেস্টমেন্ট আসলে wallet balance race condition এড়াতে DB transaction + locking (SELECT FOR UPDATE) ব্যবহার করতে হবে।

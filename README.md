# Дэлхийн гадарга — вэб сайт

Газар зүй 7-р анги, III бүлэг «Дэлхийн гадарга»-ийн аватартай асуулт хариултын тоглоом.

- **Vercel** — сайтыг байршуулна (`https://…vercel.app`)
- **Supabase** — имэйлээр 6 оронтой код илгээж нэвтрүүлнэ, тоглогчдын оноо, өрөө, тайланг хадгална
- **GitHub** — кодыг хадгална. Код өөрчлөгдөх бүрд Vercel автоматаар шинэчилнэ

Supabase тохируулаагүй үед сайт тухайн төхөөрөмж дээр офлайн горимд ажиллана.

---

## 1. GitHub-д байршуулах

1. [github.com](https://github.com) → **New repository** → нэр: `delhiin-gadarga` → **Create repository**. README бүү нэм.
2. Энэ хавтсанд терминал нээгээд (өөрийн нэрээ `ТАНЫ-НЭР` хэсэгт бичнэ):

   ```bash
   git remote add origin https://github.com/ТАНЫ-НЭР/delhiin-gadarga.git
   git push -u origin main
   ```

   Терминал ашиглахгүй бол [GitHub Desktop](https://desktop.github.com)-оор энэ хавтсыг нээгээд **Publish repository** дарж болно.

## 2. Supabase тохируулах

1. [supabase.com](https://supabase.com) → **New project**. Бүс (Region): **Singapore** эсвэл **Tokyo** (Монголд ойр). Өгөгдлийн сангийн нууц үгээ хадгалаарай.
2. **SQL Editor → New query** → `supabase/schema.sql` файлын агуулгыг бүтнээр нь буулгаад **Run**.
3. **Authentication → Emails → Templates**: **Confirm signup** ба **Magic Link** хоёр загварын агуулгыг дараахаар сольж хадгална. `{{ .Token }}` нь 6 оронтой код.

   ```html
   <h2>Дэлхийн гадарга</h2>
   <p>Нэвтрэх код: <b style="font-size:22px">{{ .Token }}</b></p>
   <p>Код 1 цаг хүчинтэй. Та хүсээгүй бол энэ захидлыг үл тоомсорлоно уу.</p>
   ```

4. **⚠️ Имэйлийн хязгаар.** Supabase-ийн үнэгүй имэйл үйлчилгээ цагт хэдхэн л имэйл илгээдэг. Ангиараа ашиглах бол **Authentication → Emails → SMTP Settings** хэсэгт өөрийн имэйл үйлчилгээг холбоно. Жишээ нь: Gmail-ийн «App password», [Resend](https://resend.com), [Brevo](https://brevo.com)-ийн үнэгүй багц.
5. **Project Settings → API** хэсгээс **Project URL** ба **anon public** түлхүүрийг хуулна.

## 3. Vercel-д байршуулах

1. [vercel.com](https://vercel.com) → GitHub-аар нэвтэрнэ → **Add New → Project** → `delhiin-gadarga`-г **Import** хийнэ.
2. **Framework Preset:** Other. Бүтээх тохиргоог `vercel.json` өөрөө заана: `npm run build`, `public`.
3. Supabase-ийн холбоос болон publishable түлхүүр `config.public.json` файлд аль хэдийн байгаа. Тиймээс **Environment Variables** тохируулах шаардлагагүй. Өөр Supabase төсөл ашиглах бол `SUPABASE_URL`, `SUPABASE_ANON_KEY` хувьсагч нэмж дарж бичнэ.
4. **Deploy** дарна. `https://delhiin-gadarga.vercel.app` маягийн холбоос гарна.
5. Supabase руу буцаж **Authentication → URL Configuration** хэсэгт:
   - **Site URL** = таны Vercel холбоос
   - **Redirect URLs** = таны Vercel холбоос

## 4. Өөрийгөө багш (эзэмшигч) болгох

1. Сайтаа нээж, **өөрийн имэйлээр нэвтэрч** аватараа бүтээнэ.
2. Supabase → **SQL Editor** дээр имэйлээ сольж ажиллуулна:

   ```sql
   insert into public.teachers (user_id, role)
   select id, 'owner' from auth.users where email = 'таны@имэйл.mn'
   on conflict (user_id) do update set role = excluded.role;
   ```

3. Сайтаа дахин ачаалахад цэсэнд **«Багш»** гарна. Тэнд тайлан, асуултын сан, ангийн код, өрөөнүүд байна.

**Хамт багш нэмэх:** тэр хүн эхлээд сайтад нэвтэрнэ. Дараа нь дээрх SQL-ийг түүний имэйлээр, `'owner'`-ийн оронд `'admin'` гэж бичиж ажиллуулна. Хасах: `delete from public.teachers where user_id = (select id from auth.users where email = '…');`

## 5. Сурагчид хэрхэн тоглох вэ

1. Сайтын холбоосыг сурагчдад өгнө. Тэд имэйлээ бичиж, ирсэн кодоор нэвтэрнэ.
2. Нэвтэрсний дараа сурагчийг тоглуулах хоёр арга бий:
   - **Багш цэс → Эрх ба код** хэсгээс хүсэлтийг зөвшөөрнө.
   - Эсвэл «Анги» өрөө үүсгээд кодыг самбарт бичнэ. Сурагч уг кодыг оруулмагц шууд нэгдэнэ.
3. Ямар ч утас, компьютер дээрээс ижил имэйлээр нэвтэрвэл ахиц нь хэвээр байна.

## Код өөрчлөх, шинэчлэх

- Тоглоомын эх файлууд `src/` дотор байна.
- **Асуултууд** хариулттайгаа `questions/` хавтсанд байна. Энэ хавтас **зөвхөн таны компьютерт** байх бөгөөд GitHub-д орохгүй. Ингэснээр нээлттэй репогоос сурагчид хариулт олохгүй.
  - Асуулт засах бол `questions/gadarga-questions.js` (1-р тоглоом) эсвэл `questions/gadarga-questions-v1.js` (2-р тоглоом) файлыг засна.
  - Дараа нь `npm run build` ажиллуулна. Энэ нь нууцалсан `src/gadarga-qdata.js` файлыг шинэчилнэ.
  - `questions/` хавтсаа устгахгүй, нөөцлөөд хадгалаарай.
- Өөрчилсний дараа `git add -A` → `git commit -m "…"` → `git push` хийхэд Vercel хэдэн минутын дотор автоматаар шинэчилнэ.

### Компьютер дээрээ турших

```bash
copy config.local.example.json config.local.json
npm run build
npm run dev
```

`config.local.json` файлд Supabase-ийн URL ба түлхүүрээ бичнэ. Хөтчөөр http://localhost:3000 хаягийг нээнэ. Энэ файл GitHub-д орохгүй.

## Хамгаалалт

- Хамгаалалтыг `supabase/schema.sql` доторх **Row Level Security** дүрмүүд хийнэ:
  - Сурагч зөвхөн өөрийн ахиц, оноо, тайлангаа бичнэ.
  - Бусдын нэр, аватар, оноог л харна.
  - Бүх сурагчийн алдаа, хариулт, ангийн кодыг зөвхөн `teachers` хүснэгтэд бүртгэлтэй хүн харна.
- `anon public` түлхүүр нийтэд харагдах зориулалттай тул нууц биш. Харин **service_role** түлхүүрийг хэзээ ч сайтад эсвэл GitHub-д бүү оруулаарай.
- Асуултын хариулт кодонд шууд харагдахгүй нууцлагдсан. Оноог хөтөч тооцдог тул компьютерт маш сайн хүн хуурах боломж бага ч гэсэн бий. Багшийн тайлан дахь хариултын түүхээр сэжигтэй оноог илрүүлнэ.

## Файлын бүтэц

```
src/                  эх файлууд (HTML, CSS, JavaScript, асуултууд)
  gadarga-cloud.js    Supabase-ийн холболт (нэвтрэлт, хадгалалт)
scripts/build.js      src/ → public/ (асуултыг нууцлах, config.js үүсгэх)
scripts/dev.js        компьютер дээр турших сервер
supabase/schema.sql   өгөгдлийн сан ба хамгаалалтын дүрэм
vercel.json           Vercel-ийн тохиргоо
```

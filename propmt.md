اول میخام پروژه کامل بخونی 

1. در فهرست مطالب ایکون ایتم وسط مشکل داره 

همون که تقریبا به این صورته 

--- |

میخام ایتم وسط یک چیز جدید بهش اضافه کنی 
العان ما فقط این حالت هارو داریم 

1.1. ایتم اول 
----
    |
1.2. ایتم دوم تا یکی مونده به اخر (وسط)
--- |
1.3. ایتم اخر
    |
----
1.4. ایتم زیر مجموعه 
---       |

میخام زیر مجموعه رو پیشرفته تر کنیم 
میخام اولا که خط شنزدیک به ایتمی که زیر مجموعشه مثلا
---- ----
         |
و میخام اگر ایتم زیر مجموعه برای ایتم اول بود اینطوری نشون بده 
---- ----
         |
و اگر برای ایتم بخر بود اینطوری نشون بده
         |
---- ----

و اگر ایتم وسط بود اینطوری نشون بده 
---- ---- |
میخام شکل این زیر مجموعه تماما مثل ایتم اول و وسط و اخر باشه 
2. میخام تغییرات بزرگی در صفحه بندی بدی 

میخام صفحه بندی رو هر موقع دوست داشتم با چقدر زیر شاخه که دوست داشتم درست کنم 

العان دوست دارم به این تغییر بدم
content/
├── books/
│   └── answer-to-shobhat/
│       └── alhad-noven-part1/
│           ├── pages/
│               ├── 1.md
│               ├── 2.md
│               ...
│           └── index.md
└── media/
│   └── lives-nour/
│       └── spider-house/
│           └── tahref-quran-nazd-shia/
│               └── index.md

content/
├── media/
│   └── lives-nour/
│       ├── motaghiya/
│           └── kashti-najat/
│               └── index.md
│       └── spider-house/
│           ...
│           └── tahref-quran-nazd-shia/
│               └── index.md
│
└── book/
    └── answer-to-shobhat/
        └── alhad-noven-part1/
                ├── pages/1.md 2.md ...
                └── index.md

میخای بگی اسم فارسیشون از کجا بیاد یک فایل داشتیم مثلا blog-date.json 
میخام اسم های اینا تغییر بدی به اسم پوشه های یک زیر شاخه زیر content باشه 

توی مثال بالایی که زدم میشه 
books.json
media.json

یک حالتی قبلا گفتم درست کنی که با npm run dev این زمان توی این فایل های جیسون ثبت میشد حالا قراره یکم پیشرفته ترش کنی توی این فایل های جیسون حالا علاوه بر زمان اسم روت که میشه از پوشه مثلا
content = /
content/answer-to-shobhat/alhad-noven-part1 = /answer-to-shobhat/alhad-noven-part1

(و برای اسم فارسی کاری نمیخاد بکنی تو توی جیسون اسم اینگلیسی که میشه همون اسم پوشه رو میزاری بجای اسم پوشه خودم میام فارسیش رو میزارم)

و یک نکته میخام تا رسیدن به پوشه ای که داخلش فایل ام دی هست بره مثل خانه و سرچ بزاره 

یعنی چی 

یعنی 
content = مثل صفحه خانه فعلی با سرچ باکس با ایتم ها
content/lives-nour = مثل صفحه خانه فعلی با سرچ باکس با ایتم ها
content/lives-nour/spider-house = مثل صفحه خانه فعلی با سرچ باکس با ایتم ها
content/lives-nour/spider-house/tahref-quran-nazd-shia/ = مقاله هست چون داخل این پوشه index.md هست

3. میخام برای هر زیر شاخه صفحه اصلی (العان میشه مدیا و بوک) استوری جدا گانه داشته باشن
4. آره میخام وقتی منبع کپی شد در تلگرام اینجوری بشن
`متن آماده کپی با کلیک`
1. میخام لینک باشه که به یک بخش مقاله اشاره کنه 
که وقتی روش کلیک میشه بره توی همون صفحه و اسکرول رو ببره به همون بخش 
و وقتی درست کردی یاد هم بده چطوری لینک بدیم
6. استایل دهی سورس میخام زیبا باشه چون توی کتاب خیلی زیاد ازش استفاده میکنم
7. داخل تمام صفحات غیر خانه میخام nav باشه چون اینطوری که العان هست حرکت توی صفحات خیلی سخته 

<nav aria-label="مسیر صفحه" class="flex min-w-0 flex-wrap items-center gap-1 text-xs text-[var(--muted)]"><a class="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]" href="/Weblogs/">خانه</a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left size-3 ltr:rotate-180" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg><a class="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]" href="/Weblogs/media">رسانه‌ها</a><span class="contents"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left size-3 ltr:rotate-180" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg><a class="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]" href="/Weblogs/media/lives-nour">Lives Nour</a></span><span class="contents"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left size-3 ltr:rotate-180" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg><a class="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]" href="/Weblogs/media/lives-nour/motaghiya">Motaghiya</a></span><span class="contents"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left size-3 ltr:rotate-180" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg><span aria-current="page" class="max-w-full truncate">کشتی نجات؛ جایگاه پیامبر و پیروی از سنت او</span></span></nav>
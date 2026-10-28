/**
 * Messages a reader can send to the author about an article that is not finished yet
 * (see IncompleteNotice). `{title}` is replaced with the article title.
 * Keep them short, polite and human; add or edit freely (any count works).
 */
export const FOLLOW_UP_MESSAGES: readonly string[] = [
  'السلام علیکم 🌹\nمیخواستم بدونم مقاله «{title}» کی تکمیل میشه؟ مشتاقانه منتظرم تموم بشه تا بخونمش.',
  'سلام و وقت بخیر 🌷\nمقاله «{title}» هنوز ناقصه. ان‌شاءالله به‌زودی کاملش می‌کنید؟ خیلی دوست دارم بخونمش.',
  'سلام، خسته نباشید 🙏\nبرای تکمیل مقاله «{title}» زمان تقریبی دارید؟ منتظرم.',
  'درود بر شما 🌹\nمقاله «{title}» رو دیدم ولی هنوز کامل نیست. اگه امکانش هست بفرمایید کی تکمیل میشه؟',
  'السلام علیکم و رحمة الله\nممنون از زحماتتون. مقاله «{title}» چه زمانی کامل می‌شه؟ مشتاق خوندنش هستم.',
  'سلام 🌷 ببخشید مزاحم شدم. مقاله «{title}» هنوز تموم نشده؛ اگه ممکنه خبر بدید کی آماده میشه 🙏',
  'وقت بخیر 🌹\nمنتظر تکمیل مقاله «{title}» هستم. ان‌شاءالله زودتر تمومش کنید.',
  'سلام و عرض ادب\nدلم می‌خواد مقاله «{title}» رو کامل بخونم. می‌شه بفرمایید کی کاملش میشه؟',
  'السلام علیکم 🌹\nمقاله «{title}» نیمه‌کاره‌ست. ممنون میشم اگه خبر بدید کِی تکمیلش می‌کنید.',
  'سلام، روز بخیر ☀️\nبرای مقاله «{title}» یه تاریخ تقریبی دارید؟ خیلی مشتاقم بخونمش.',
  'درود و سپاس از وبلاگتون 🌷\nمقاله «{title}» هنوز کامل نشده؛ پیگیرش هستم. کی آماده میشه؟',
  'سلام 🙏 خدا قوت\nمنتظر باقیِ مقاله «{title}» هستم. ان‌شاءالله به‌زودی کاملش کنید.',
  'السلام علیکم 🌹\nدوست داشتم بدونم تکمیل مقاله «{title}» چقدر دیگه طول می‌کشه؟',
  'سلام، وقتتون بخیر\nمقاله «{title}» از اونایی بود که خیلی منتظرشم. کی کاملش می‌کنید؟ 🌷',
  'سلام و احترام 🌹\nاگه فرصت کردید مقاله «{title}» رو تکمیل کنید؛ من مرتب سر می‌زنم ببینم تموم شده یا نه 😊',
  'درود 🙏\nمیشه بفرمایید مقاله «{title}» ان‌شاءالله چه موقع کامل میشه؟ ممنون از لطفتون.',
  'السلام علیکم، خسته نباشید 🌷\nمقاله «{title}» هنوز تموم نشده. منتظر خبر خوشتون هستم.',
  'سلام ☺️ ببخشید که پیام میدم. مقاله «{title}» کی کامل میشه؟ واقعاً مشتاقم.',
  'وقت شما بخیر 🌹\nبرای خوندن کاملِ مقاله «{title}» منتظرم. ان‌شاءالله زودتر تکمیلش کنید.',
  'سلام و درود 🙏\nمقاله «{title}» رو شروع کردم بخونم ولی ناقصه. کی تمومش می‌کنید؟',
  'السلام علیکم 🌹\nاگه امکانش هست بفرمایید زمان تکمیل مقاله «{title}» تقریباً کیه. سپاسگزارم.',
  'سلام، عصر بخیر 🌆\nمنتظر مقاله «{title}» هستم و هنوز کامل نشده. ممنون میشم خبر بدید.',
  'سلام 🌷 خدا خیرتون بده بابت این مطالب\nمقاله «{title}» کی کامل میشه؟ مشتاقانه منتظرم.',
  'درود بر شما 🌹\nمقاله «{title}» هنوز کامل نشده؛ ان‌شاءالله به‌زودی؟ خیلی دوست دارم کاملش رو بخونم.',
  'السلام علیکم و رحمة الله 🌷\nبا تشکر از زحماتتون، مقاله «{title}» چه زمانی کامل خواهد شد؟ منتظر هستم.',
]

export function fillTitle(template: string, title: string): string {
  return template.split('{title}').join(title)
}

/** `https://t.me/name` (or telegram.me) → `name`. The first Telegram link in the list wins. */
export function telegramUsername(links: readonly { href: string }[]): string | null {
  for (const { href } of links) {
    const match = href.match(/^https?:\/\/(?:t|telegram)\.me\/([A-Za-z][A-Za-z0-9_]{3,})\/?(?:\?.*)?$/i)
    if (match) return match[1]
  }
  return null
}

/** Opens the author's chat with the message already typed in the input. */
export function followUpUrl(username: string, template: string, title: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(fillTitle(template, title))}`
}

/** A random index that differs from `avoid` whenever there is more than one message. */
export function pickIndex(count: number, avoid: number | null = null, random: () => number = Math.random): number {
  if (count <= 1) return 0
  const pool = Array.from({ length: count }, (_, index) => index).filter((index) => index !== avoid)
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}

/** Message sent to the author by a visitor of a page the author has hidden (`show: false`). `{url}` is the page address. */
export const UNLOCK_MESSAGE = 'السلام علیکم 🌹\nاین صفحه قفل است و اجازهٔ نمایشش داده نشده: {url}\nاگر امکانش هست قفلش را باز کنید. ممنون 🙏'

/** Opens the author's chat with the «please unlock this page» message already typed in. */
export function unlockUrl(username: string, pageUrl: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(UNLOCK_MESSAGE.split('{url}').join(pageUrl))}`
}

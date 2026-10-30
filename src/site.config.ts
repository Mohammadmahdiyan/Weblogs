export interface SiteConfig {
  siteName: string
  siteDescription: string
  siteUrl: string
  defaultFont: string
  announcement: {
    enabled: boolean
    text: string
    linkText: string
    linkHref: string
  }
  nav: { label: string; href: string }[]
  footerLinks: { label: string; href: string }[]
  social: { label: string; href: string }[]
  sidebarCards: { icon: string; title: string; text: string; href: string }[]
  /** Hostnames allowed for generic embeds. Others still render, with an «external content» notice. */
  embedAllowlist: string[]
  /** false = never request the YouTube poster image (no third-party request before a click). */
  embedPoster: boolean
  /**
   * Your profile picture. Used in the header story ring and on the answer side of chat accordions.
   * `avatar`: a file inside `public/` (e.g. 'profile.jpg' → public/profile.jpg) or a full https URL.
   * Leave it '' to show a letter instead of a picture.
   */
  profile: { name: string; avatar: string }
  /** Daily story (header ring). See «استوری» in README.md. */
  story: { enabled: boolean; slideSeconds: number }
}

const siteConfig: SiteConfig = {
  siteName: 'وبلاگ اسلامی',
  siteDescription: 'مقاله‌ها و یادداشت‌های آموزشی',
  siteUrl: 'https://mohammadmahdiyan.github.io/Weblogs',
  defaultFont: 'Vazirmatn',
  announcement: {
    enabled: false,
    text: 'به وبلاگ خوش آمدید',
    linkText: 'بیشتر بدانید',
    linkHref: '/about',
  },
  nav: [
    { label: 'خانه', href: '/' },
    { label: 'همه مقاله‌ها', href: '/#articles' },
    { label: 'کتاب‌ها', href: '/books' },
  ],
  footerLinks: [
    { label: 'خانه', href: '/' },
    { label: 'همه مقاله‌ها', href: '/#articles' },
    { label: 'کتاب‌ها', href: '/books' },
  ],
  social: [
    {
      href: "https://t.me/Rasoolallah_s_is_best",
      label: "تلگرام من"
    }
  ],
  sidebarCards: [],
  embedAllowlist: [
    'youtube.com',
    'youtube-nocookie.com',
    'instagram.com',
    'aparat.com',
    // Add the hostnames of your hadith / reference websites here, e.g.:
    // 'hadith.example.org',
  ],
  embedPoster: true,
  profile: {
    name: 'وبلاگ اسلامی',
    avatar: '',
  },
  story: {
    enabled: true,
    // Time each picture / text stays on screen.
    slideSeconds: 6,
  },
}

export default siteConfig
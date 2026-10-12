export interface SiteConfig {
  siteName: string
  siteDescription: string
  siteUrl: string
  defaultFont: string
  defaultStyle: number
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
}

const siteConfig: SiteConfig = {
  siteName: 'وبلاگ اسلامی',
  siteDescription: 'مقاله‌ها و یادداشت‌های آموزشی',
  siteUrl: 'https://mohammadmahdiyan.github.io/Weblogs',
  defaultFont: 'Vazirmatn',
  defaultStyle: 1,
  announcement: {
    enabled: false,
    text: 'به وبلاگ خوش آمدید',
    linkText: 'بیشتر بدانید',
    linkHref: '/about',
  },
  nav: [
    { label: 'خانه', href: '/' },
    { label: 'همه مقاله‌ها', href: '/#articles' },
  ],
  footerLinks: [
    { label: 'خانه', href: '/' },
    { label: 'همه مقاله‌ها', href: '/#articles' },
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
}

export default siteConfig
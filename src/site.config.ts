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
  embedAllowlist: string[]
  embedPoster: boolean
}

const siteConfig: SiteConfig = {
  siteName: 'وبلاگ اسلامی',
  siteDescription: 'مقاله‌ها و یادداشت‌های آموزشی',
  siteUrl: 'https://example.com',
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
  social: [],
  sidebarCards: [],
  embedAllowlist: [
    'youtube.com',
    'www.youtube-nocookie.com',
    'instagram.com',
    'www.instagram.com',
    'aparat.com',
    'www.aparat.com',
  ],
  embedPoster: true,
}

export default siteConfig
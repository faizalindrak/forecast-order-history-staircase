export interface NavItem {
  href: string
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
  },
  {
    href: '/upload',
    label: 'Upload Forecast',
  },
]

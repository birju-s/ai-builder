// Valid lucide-react icon exports, loaded dynamically from the installed package.
// Falls back to a curated subset if dynamic loading fails (e.g., in edge runtime).

function loadIconsFromPackage(): Set<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('lucide-react')
    const icons = new Set<string>()
    for (const key of Object.keys(mod)) {
      // Only PascalCase exports that don't end with "Icon" (those are aliases)
      if (/^[A-Z]/.test(key) && !key.endsWith('Icon') && typeof mod[key] === 'object') {
        icons.add(key)
      }
    }
    if (icons.size > 100) return icons
  } catch {
    // Fall through to static fallback
  }
  return FALLBACK_ICONS
}

const FALLBACK_ICONS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ChevronUp', 'ChevronDown',
  'ChevronLeft', 'ChevronRight', 'Check', 'CheckCircle', 'X', 'XCircle', 'Plus',
  'Minus', 'Menu', 'Search', 'Home', 'ExternalLink', 'Link', 'Settings', 'Edit',
  'Trash', 'Trash2', 'Save', 'Download', 'Upload', 'Share', 'Eye', 'EyeOff',
  'Lock', 'Unlock', 'Key', 'LogIn', 'LogOut', 'Zap', 'Star', 'Heart', 'Mail',
  'Phone', 'Bell', 'User', 'Users', 'MapPin', 'Clock', 'Calendar', 'Image',
  'Camera', 'Play', 'Pause', 'Volume2', 'Mic', 'Music', 'MessageCircle', 'Send',
  'ThumbsUp', 'Award', 'Trophy', 'CreditCard', 'ShoppingCart', 'ShoppingBag',
  'Store', 'Package', 'Tag', 'TrendingUp', 'BarChart', 'Activity', 'Building',
  'Briefcase', 'Monitor', 'Laptop', 'Smartphone', 'Cpu', 'Server', 'Database',
  'Cloud', 'Wifi', 'Code', 'Terminal', 'Globe', 'Bot', 'Brain', 'Sparkles',
  'File', 'FileText', 'Folder', 'Book', 'BookOpen', 'Sun', 'Moon', 'Flame',
  'Leaf', 'Mountain', 'Shield', 'AlertTriangle', 'Info', 'Circle', 'Square',
  'Triangle', 'Diamond', 'Target', 'Lightbulb', 'Gift', 'Coffee', 'Palette',
  'Wrench', 'GraduationCap', 'Fingerprint', 'Headphones', 'Layers', 'Box',
  'Croissant', 'Pizza', 'Wine', 'Beer', 'Apple', 'Cherry', 'Banana', 'Utensils',
  'UtensilsCrossed', 'Cake', 'Cookie', 'Sandwich', 'Salad', 'Soup', 'Egg',
  'Loader2', 'MoreHorizontal', 'MoreVertical', 'Filter', 'Copy', 'Clipboard',
  'RefreshCw', 'RotateCw', 'LayoutGrid', 'LayoutDashboard', 'Pencil', 'Pen',
  'Eraser', 'Bookmark', 'Flag', 'Video', 'Radio', 'Inbox', 'MessageSquare',
  'AtSign', 'Hash', 'Contact', 'Handshake', 'Smile', 'Crown', 'Medal',
  'Wallet', 'DollarSign', 'Receipt', 'Ticket', 'PieChart', 'LineChart',
  'Percent', 'Landmark', 'Factory', 'Tablet', 'HardDrive', 'Signal',
  'Bluetooth', 'Code2', 'Bug', 'QrCode', 'Scan', 'Wand2', 'Puzzle',
  'Files', 'FolderOpen', 'Library', 'Notebook', 'Newspaper', 'ScrollText',
  'Wind', 'Thermometer', 'Droplets', 'Waves', 'TreePine', 'Flower', 'Sprout',
  'Timer', 'Hourglass', 'AlarmClock', 'History', 'Map', 'Navigation', 'Compass',
  'Route', 'Car', 'Truck', 'Plane', 'Rocket', 'ShieldCheck', 'CircleAlert',
  'Siren', 'BadgeCheck', 'Stethoscope', 'HeartPulse', 'Accessibility',
  'Hexagon', 'Octagon', 'Pentagon', 'Asterisk', 'Infinity', 'Crosshair',
  'Focus', 'Lamp', 'PartyPopper', 'Paintbrush', 'Ruler', 'Hammer', 'Cog',
  'School', 'Gamepad', 'Speaker', 'Printer', 'Cable', 'Plug', 'BatteryFull',
  'Recycle', 'GitBranch', 'GitCommit', 'Component', 'Boxes',
])

export const VALID_ICONS: Set<string> = loadIconsFromPackage()

// Normalized lookup: lowercase stripped -> original name
const NORMALIZED_MAP = new Map<string, string>()
for (const icon of VALID_ICONS) {
  NORMALIZED_MAP.set(icon.toLowerCase(), icon)
}

// Common hallucination patterns: wrong name -> correct name
const HALLUCINATION_MAP = new Map<string, string>([
  // Reversed word order
  ['rightarrow', 'ArrowRight'], ['leftarrow', 'ArrowLeft'],
  ['uparrow', 'ArrowUp'], ['downarrow', 'ArrowDown'],
  ['rightchevron', 'ChevronRight'], ['leftchevron', 'ChevronLeft'],

  // Wrong suffixes/prefixes
  ['checkmark', 'Check'], ['checkicon', 'Check'],
  ['closeicon', 'X'], ['close', 'X'], ['cross', 'X'],
  ['hamburger', 'Menu'], ['hamburgermenu', 'Menu'],
  ['magnifyingglass', 'Search'], ['searchicon', 'Search'],
  ['homeicon', 'Home'], ['settingsicon', 'Settings'],
  ['trashcan', 'Trash2'], ['delete', 'Trash2'], ['deleteicon', 'Trash2'],
  ['editicon', 'Edit'], ['pencilicon', 'Pencil'],
  ['eyeicon', 'Eye'], ['viewicon', 'Eye'],
  ['lockicon', 'Lock'], ['unlockicon', 'Unlock'],
  ['staricon', 'Star'], ['hearticon', 'Heart'],
  ['mailicon', 'Mail'], ['emailicon', 'Mail'], ['email', 'Mail'],
  ['phoneicon', 'Phone'], ['telephone', 'Phone'],
  ['locationicon', 'MapPin'], ['location', 'MapPin'], ['pin', 'MapPin'],
  ['clockicon', 'Clock'], ['timeicon', 'Clock'], ['time', 'Clock'],
  ['usericon', 'User'], ['personicon', 'User'], ['person', 'User'],
  ['carticon', 'ShoppingCart'], ['cart', 'ShoppingCart'],
  ['bagicon', 'ShoppingBag'], ['bag', 'ShoppingBag'],
  ['linkicon', 'Link'], ['externalicon', 'ExternalLink'],
  ['downloadicon', 'Download'], ['uploadicon', 'Upload'],
  ['playicon', 'Play'], ['pauseicon', 'Pause'],
  ['bellicon', 'Bell'], ['notificationicon', 'Bell'], ['notification', 'Bell'],
  ['calendaricon', 'Calendar'], ['dateicon', 'Calendar'],
  ['fileicon', 'File'], ['documenticon', 'FileText'], ['document', 'FileText'],
  ['foldericon', 'Folder'],
  ['imageicon', 'Image'], ['photoicon', 'Image'], ['photo', 'Image'],
  ['videoicon', 'Video'],
  ['musicicon', 'Music'],
  ['sunicon', 'Sun'], ['moonicon', 'Moon'],
  ['cloudicon', 'Cloud'],
  ['shieldicon', 'Shield'],
  ['lightningicon', 'Zap'], ['lightning', 'Zap'], ['bolt', 'Zap'],
  ['warningicon', 'AlertTriangle'], ['warning', 'AlertTriangle'],
  ['erroricon', 'XCircle'], ['error', 'XCircle'],
  ['successicon', 'CheckCircle'], ['success', 'CheckCircle'],
  ['infoicon', 'Info'], ['information', 'Info'],
  ['helpicon', 'HelpCircle'], ['help', 'HelpCircle'],
  ['globeicon', 'Globe'], ['worldicon', 'Globe'], ['world', 'Globe'],
  ['moneyicon', 'DollarSign'], ['money', 'DollarSign'], ['dollar', 'DollarSign'],
  ['creditcardicon', 'CreditCard'],
  ['charticon', 'BarChart'], ['chart', 'BarChart'], ['graph', 'BarChart'],
  ['trendingicon', 'TrendingUp'], ['trending', 'TrendingUp'],
  ['sparkle', 'Sparkles'], ['sparkleicon', 'Sparkles'],
  ['magic', 'Wand2'], ['magicwand', 'Wand2'],
  ['roboticon', 'Bot'], ['robot', 'Bot'], ['ai', 'Bot'],
  ['brainicon', 'Brain'],
  ['targeticon', 'Target'],
  ['rocketicon', 'Rocket'],
  ['gifticon', 'Gift'],
  ['coffeeicon', 'Coffee'],
  ['bookicon', 'Book'],
  ['graduation', 'GraduationCap'],

  // Deprecated / old names
  ['edit2', 'Pencil'],
  ['alertcircle', 'CircleAlert'],
  ['helpcircle', 'CircleHelp'],

  // With "Icon" suffix stripped
  ['arrowrightsquare', 'ArrowRight'],
])

export function resolveIconName(name: string): string | null {
  if (VALID_ICONS.has(name)) return name

  const lower = name.toLowerCase().replace(/icon$/i, '')

  // Try exact lowercase match
  const exact = NORMALIZED_MAP.get(lower)
  if (exact) return exact

  // Try exact lowercase match with "Icon" suffix
  const withoutSuffix = NORMALIZED_MAP.get(lower.replace(/icon$/i, ''))
  if (withoutSuffix) return withoutSuffix

  // Try hallucination map
  const hallucinated = HALLUCINATION_MAP.get(lower)
  if (hallucinated) return hallucinated

  // Try removing common prefixes
  for (const prefix of ['icon', 'ic']) {
    const stripped = lower.replace(new RegExp(`^${prefix}`), '')
    const found = NORMALIZED_MAP.get(stripped)
    if (found) return found
  }

  // Fuzzy: find closest by Levenshtein distance (only if distance <= 3)
  let bestMatch: string | null = null
  let bestDist = 4
  for (const [key, val] of NORMALIZED_MAP) {
    const d = levenshtein(lower, key)
    if (d < bestDist) {
      bestDist = d
      bestMatch = val
    }
  }

  return bestMatch
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  if (Math.abs(a.length - b.length) > 3) return 4 // early exit

  const matrix: number[][] = []
  for (let i = 0; i <= a.length; i++) matrix[i] = [i]
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
    // Early exit if entire row exceeds threshold
    if (Math.min(...matrix[i]) > 3) return 4
  }

  return matrix[a.length][b.length]
}

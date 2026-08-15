/**
 * Kedama Design System — Icon System
 *
 * Lucide React をベースにしたアイコンシステム。
 * 業務システムで頻出するアイコンを re-export し、
 * デザインシステム内で統一的に利用する。
 *
 * Lucide の特徴:
 * - stroke ベース、デフォルト 24×24
 * - currentColor を使用（親要素の text-* で色が変わる）
 * - Tree-shakable（使ったアイコンだけバンドルに含まれる）
 *
 * @example
 * ```tsx
 * import { Search, Plus, Trash2 } from '@kedama-design/design-system';
 *
 * <Search size={20} className="text-fg-muted" />
 * <Plus size={16} />
 * <Trash2 size={20} className="text-[var(--color-status-danger)]" />
 * ```
 */

// Lucide の LucideProps をそのまま利用する
export type { LucideProps as IconProps } from 'lucide-react';

// ─── 業務システム頻出アイコン re-export ─────────────────
// Lucide の名前をそのまま使用。利用側は必要なアイコンを名前で import する。

export {
  // ナビゲーション
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ExternalLink,

  // アクション
  Plus,
  Pencil,
  Trash2,
  Copy,
  Download,
  Upload,
  Filter,
  RotateCcw,

  // ステータス・フィードバック
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  CircleHelp,
  Loader2,

  // オブジェクト
  Settings,
  User,
  Users,
  Mail,
  Bell,
  Calendar,
  FileText,
  Folder,
  Eye,
  EyeOff,
  Lock,
  Unlock,

  // レイアウト
  Menu,
  MoreHorizontal,
  MoreVertical,
  Grip,
} from 'lucide-react';

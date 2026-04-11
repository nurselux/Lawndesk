import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Minus,
  RefreshCw,
  FileText,
  Send,
  DollarSign,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Job status config
// ---------------------------------------------------------------------------

export interface StatusConfig {
  icon: LucideIcon
  color: string
  bg: string
  label: string
}

export const jobStatusConfig: Record<string, StatusConfig> = {
  '🔵 Scheduled': {
    icon: Clock,
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    label: 'Scheduled',
  },
  '🟡 In Progress': {
    icon: Loader2,
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    label: 'In Progress',
  },
  '🟢 Completed': {
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    label: 'Completed',
  },
  '🔴 Cancelled': {
    icon: XCircle,
    color: 'text-red-700',
    bg: 'bg-red-100',
    label: 'Cancelled',
  },
}

// ---------------------------------------------------------------------------
// Invoice status config
// ---------------------------------------------------------------------------

export const invoiceStatusConfig: Record<string, StatusConfig> = {
  '🟡 Unpaid': {
    icon: Clock,
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    label: 'Unpaid',
  },
  '🟢 Paid': {
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    label: 'Paid',
  },
  '🔴 Overdue': {
    icon: AlertTriangle,
    color: 'text-red-700',
    bg: 'bg-red-100',
    label: 'Overdue',
  },
  '🟠 Partial': {
    icon: DollarSign,
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    label: 'Partial',
  },
}

// ---------------------------------------------------------------------------
// Quote status config
// ---------------------------------------------------------------------------

export const quoteStatusConfig: Record<string, StatusConfig> = {
  draft: {
    icon: FileText,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    label: 'Draft',
  },
  sent: {
    icon: Send,
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    label: 'Sent',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    label: 'Approved',
  },
  declined: {
    icon: XCircle,
    color: 'text-red-700',
    bg: 'bg-red-100',
    label: 'Declined',
  },
  converted: {
    icon: RefreshCw,
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    label: 'Converted',
  },
}

// ---------------------------------------------------------------------------
// Recurring type config
// ---------------------------------------------------------------------------

export interface RecurringConfig {
  icon: LucideIcon
  color: string
  bg: string
  label: string
}

export const recurringConfig: Record<string, RecurringConfig> = {
  '🔂 One-time': {
    icon: Minus,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    label: 'One-time',
  },
  '🔄 Weekly': {
    icon: RefreshCw,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    label: 'Weekly',
  },
  '🔄 Biweekly': {
    icon: RefreshCw,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    label: 'Biweekly',
  },
  '🔄 Monthly': {
    icon: RefreshCw,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    label: 'Monthly',
  },
}

// ---------------------------------------------------------------------------
// Helper: strip leading emoji from a DB status string for display
// ---------------------------------------------------------------------------

export function stripEmoji(str: string): string {
  // Remove a leading emoji cluster followed by optional space
  return str.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/u, '')
}

// ---------------------------------------------------------------------------
// Badge components
// ---------------------------------------------------------------------------

export function JobStatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const cfg = jobStatusConfig[status]
  if (!cfg) return <span className={`text-xs font-bold py-1 px-2 rounded-full bg-gray-100 text-gray-600 ${className}`}>{status}</span>
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold py-1 px-2.5 rounded-full ${cfg.bg} ${cfg.color} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {cfg.label}
    </span>
  )
}

export function InvoiceStatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const cfg = invoiceStatusConfig[status]
  if (!cfg) return <span className={`text-xs font-bold py-1 px-2 rounded-full bg-gray-100 text-gray-600 ${className}`}>{status}</span>
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold py-1 px-2.5 rounded-full ${cfg.bg} ${cfg.color} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {cfg.label}
    </span>
  )
}

export function QuoteStatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const cfg = quoteStatusConfig[status]
  if (!cfg) return <span className={`text-xs font-bold py-1 px-2 rounded-full bg-gray-100 text-gray-600 ${className}`}>{status}</span>
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold py-1 px-2.5 rounded-full ${cfg.bg} ${cfg.color} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {cfg.label}
    </span>
  )
}

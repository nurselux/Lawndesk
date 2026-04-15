import { Circle, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

// Job statuses
export const JOB_STATUSES = ['scheduled', 'completed', 'cancelled'] as const
export type JobStatus = typeof JOB_STATUSES[number]

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  scheduled:   { label: 'Scheduled',   color: 'text-blue-600',   bgColor: 'bg-blue-100',   icon: Circle },
  completed:   { label: 'Completed',   color: 'text-green-600',  bgColor: 'bg-green-100',  icon: CheckCircle },
  cancelled:   { label: 'Cancelled',   color: 'text-red-600',    bgColor: 'bg-red-100',    icon: XCircle },
}

// Invoice statuses
export const INVOICE_STATUSES = ['unpaid', 'paid', 'overdue'] as const
export type InvoiceStatus = typeof INVOICE_STATUSES[number]

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  unpaid:  { label: 'Unpaid',  color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  paid:    { label: 'Paid',    color: 'text-green-600',  bgColor: 'bg-green-100',  icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'text-red-600',    bgColor: 'bg-red-100',    icon: AlertCircle },
}

// Recurring types
export const RECURRING_TYPES = ['one_time', 'weekly', 'biweekly', 'monthly'] as const
export type RecurringType = typeof RECURRING_TYPES[number]

export const RECURRING_CONFIG: Record<RecurringType, { label: string; icon: React.ComponentType<any> }> = {
  one_time: { label: 'One-time', icon: Circle },
  weekly:   { label: 'Weekly',   icon: RefreshCw },
  biweekly: { label: 'Biweekly', icon: RefreshCw },
  monthly:  { label: 'Monthly',  icon: RefreshCw },
}

// Service types (booking page)
export const SERVICE_TYPES = ['lawn_mowing', 'hedge_trimming', 'leaf_blowing', 'leaf_removal'] as const
export type ServiceType = typeof SERVICE_TYPES[number]

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  lawn_mowing:    'Lawn Mowing',
  hedge_trimming: 'Hedge Trimming',
  leaf_blowing:   'Leaf Blowing',
  leaf_removal:   'Leaf Removal',
}

// Helper components
export function JobStatusBadge({ status }: { status: string }) {
  const config = JOB_STATUS_CONFIG[status as JobStatus]
  if (!config) return <span>{status}</span>
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const config = INVOICE_STATUS_CONFIG[status as InvoiceStatus]
  if (!config) return <span>{status}</span>
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

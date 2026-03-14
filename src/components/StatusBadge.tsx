interface StatusBadgeProps {
  status: 'modified' | 'new' | 'deleted'
}

const statusStyles = {
  modified: 'bg-[#2d2a1e] text-[#e8b931] border-[#5c4d1a]',
  new: 'bg-[#1a2e1a] text-[#4eca6a] border-[#2a5c2a]',
  deleted: 'bg-[#2e1a1a] text-[#e84040] border-[#5c2a2a]',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}

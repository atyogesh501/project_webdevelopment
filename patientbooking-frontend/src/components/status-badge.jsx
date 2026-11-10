import { cn } from '@/lib/utils';
const styles = {
    pending: 'bg-amber-100 text-amber-900 border-amber-200',
    approved: 'bg-accent text-accent-foreground border-primary/20',
    completed: 'bg-secondary text-secondary-foreground border-border',
    cancelled: 'bg-muted text-muted-foreground border-border line-through',
};
export function StatusBadge({ status }) {
    return (<span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', styles[status])}>
      {status}
    </span>);
}

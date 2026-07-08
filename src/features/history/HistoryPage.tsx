import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import type { HistoryEvent } from '@/domain/history/history.types';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChip } from '@/components/ui/FilterChip';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/cn';
import { eventDelta, eventName, eventVisual, type EventTone } from './event-format';
import { useHistory } from './hooks/useHistory';

type Filter = 'all' | 'purchase' | 'consume' | 'changes';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'purchase', label: 'Compras' },
  { id: 'consume', label: 'Consumo' },
  { id: 'changes', label: 'Cambios' },
];

const toneClass: Record<EventTone, string> = {
  default: 'bg-surface-2 text-muted',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  primary: 'bg-primary/15 text-primary',
};

function matchesFilter(event: HistoryEvent, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'purchase':
      return event.type === 'purchase';
    case 'consume':
      return event.type === 'consume';
    case 'changes':
      return event.type === 'create' || event.type === 'update' || event.type === 'delete';
  }
}

export function HistoryPage() {
  const events = useHistory();
  const [filter, setFilter] = useState<Filter>('all');
  const [now] = useState(() => Date.now());

  const filtered = useMemo(() => events.filter((e) => matchesFilter(e, filter)), [events, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          to="/mas"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl">Historial</h1>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin actividad"
          description="Aquí aparecerá lo que vayas creando, consumiendo y comprando."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((event) => {
            const visual = eventVisual(event.type);
            const Icon = visual.icon;
            const delta = eventDelta(event);
            return (
              <li
                key={event.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    toneClass[visual.tone],
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">
                    <span className="font-medium">{visual.verb}</span> {eventName(event)}
                  </span>
                  <span className="text-xs text-muted">
                    {formatRelativeTime(event.timestamp, now)}
                  </span>
                </span>
                {delta ? (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums',
                      delta.startsWith('+')
                        ? 'bg-success/15 text-success'
                        : 'bg-surface-2 text-muted',
                    )}
                  >
                    {delta}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

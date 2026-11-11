import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BookOpen, Flame, CheckCircle2, Sparkles } from 'lucide-react';
import type { CurriculumTopic, KanbanColumnId } from '../../data/subjectsData';
import { KanbanTopicCard } from './KanbanTopicCard';

export interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  subtitle: string;
  emptyText: string;
}

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  topics: CurriculumTopic[];
  onMoveStatus: (topicId: string, nextStatus: KanbanColumnId) => void;
  isDragActive: boolean;
}

const COLUMN_STYLES: Record<
  KanbanColumnId,
  {
    headerBg: string;
    iconBox: string;
    countBadge: string;
    activeRing: string;
    activeBg: string;
    dotColor: string;
  }
> = {
  todo: {
    headerBg: 'bg-purple-50/80 dark:bg-brand-purple/10 border-purple-200/70 dark:border-brand-purple/25',
    iconBox: 'bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight border-brand-purple/30',
    countBadge: 'bg-purple-100 text-purple-700 dark:bg-brand-purple/20 dark:text-brand-purpleLight border-purple-200 dark:border-brand-purple/30',
    activeRing: 'ring-2 ring-brand-purple/70 dark:ring-brand-purpleLight/70 border-brand-purple/60',
    activeBg: 'bg-purple-50/60 dark:bg-brand-purple/10',
    dotColor: 'bg-brand-purple dark:bg-brand-purpleLight'
  },
  in_progress: {
    headerBg: 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200/70 dark:border-amber-500/25',
    iconBox: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    countBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    activeRing: 'ring-2 ring-amber-500/70 dark:ring-amber-400/70 border-amber-500/60',
    activeBg: 'bg-amber-50/60 dark:bg-amber-500/10',
    dotColor: 'bg-amber-500 dark:bg-amber-400'
  },
  done: {
    headerBg: 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/25',
    iconBox: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    countBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    activeRing: 'ring-2 ring-emerald-500/70 dark:ring-emerald-400/70 border-emerald-500/60',
    activeBg: 'bg-emerald-50/60 dark:bg-emerald-500/10',
    dotColor: 'bg-emerald-500 dark:bg-emerald-400'
  }
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  topics,
  onMoveStatus,
  isDragActive
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: {
      columnId: column.id
    }
  });

  const theme = COLUMN_STYLES[column.id];

  const renderIcon = () => {
    if (column.id === 'todo') return <BookOpen className="w-4 h-4" />;
    if (column.id === 'in_progress') return <Flame className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOver
          ? `${theme.activeBg} ${theme.activeRing} shadow-lg`
          : isDragActive
          ? 'bg-slate-100/90 dark:bg-slate-900/75 border-slate-300/90 dark:border-slate-700/80'
          : 'bg-slate-100/80 dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3.5 border-b ${theme.headerBg} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${theme.iconBox}`}>
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dotColor}`} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {column.title}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {column.subtitle}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold tabular-nums border shrink-0 ${theme.countBadge}`}
        >
          {topics.length}
        </span>
      </div>

      {/* Droppable Body */}
      <div className="flex-1 p-3 space-y-2.5 min-h-[300px] max-h-[620px] overflow-y-auto">
        {topics.length === 0 ? (
          <div
            className={`h-full min-h-[240px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center px-4 py-8 transition-colors ${
              isOver
                ? 'border-brand-purple/60 dark:border-brand-purpleLight/60 bg-white/60 dark:bg-slate-800/60'
                : 'border-slate-300/80 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-2.5 ${theme.iconBox}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isOver ? 'Buraya bırak!' : 'Konu bulunmuyor'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              {column.emptyText}
            </p>
          </div>
        ) : (
          topics.map((topic) => (
            <KanbanTopicCard
              key={topic.id}
              topic={topic}
              status={column.id}
              onMoveStatus={onMoveStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};

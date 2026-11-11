import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  GripVertical,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Flame,
  RotateCcw
} from 'lucide-react';
import type { CurriculumTopic, KanbanColumnId } from '../../data/subjectsData';

interface KanbanTopicCardProps {
  topic: CurriculumTopic;
  status: KanbanColumnId;
  onMoveStatus?: (topicId: string, nextStatus: KanbanColumnId) => void;
  isOverlay?: boolean;
}

export const KanbanTopicCard: React.FC<KanbanTopicCardProps> = ({
  topic,
  status,
  onMoveStatus,
  isOverlay = false
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: topic.id,
    disabled: isOverlay,
    data: {
      topic,
      status
    }
  });

  const orderLabel = String(topic.order).padStart(2, '0');

  const statusAccent =
    status === 'done'
      ? 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400'
      : status === 'in_progress'
      ? 'border-l-4 border-l-amber-500 dark:border-l-amber-400'
      : 'border-l-4 border-l-brand-purple dark:border-l-brand-purpleLight';

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={`group relative rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${statusAccent} p-3.5 transition-all duration-200 select-none ${
        isOverlay
          ? 'shadow-2xl shadow-slate-900/20 dark:shadow-black/60 ring-2 ring-brand-purple/70 dark:ring-brand-purpleLight/70 scale-[1.03] rotate-[0.8deg] cursor-grabbing'
          : isDragging
          ? 'opacity-30 border-dashed scale-[0.98] shadow-none cursor-grabbing'
          : 'shadow-sm dark:shadow-md dark:shadow-black/20 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-black/35 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
            #{orderLabel}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
            {topic.examType} · {topic.subjectName}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {status === 'done' && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          )}
          {status === 'in_progress' && (
            <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          )}
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
        </div>
      </div>

      {/* Topic Title */}
      <p
        className={`text-xs sm:text-[13px] font-semibold leading-snug break-words ${
          status === 'done'
            ? 'text-slate-700 dark:text-slate-200'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {topic.title}
      </p>

      {/* Quick Move Actions (Accessible tap/click fallback alongside Drag & Drop) */}
      {!isOverlay && onMoveStatus && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-1.5 opacity-95 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity"
        >
          {status === 'todo' && (
            <>
              <button
                type="button"
                onClick={() => onMoveStatus(topic.id, 'in_progress')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/25 transition"
              >
                <span>Çalışıyorum</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onMoveStatus(topic.id, 'done')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/25 transition"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Bitir</span>
              </button>
            </>
          )}

          {status === 'in_progress' && (
            <>
              <button
                type="button"
                onClick={() => onMoveStatus(topic.id, 'todo')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                title="Çalışılacak Konulara Geri Al"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Geri</span>
              </button>
              <button
                type="button"
                onClick={() => onMoveStatus(topic.id, 'done')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 transition"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Bitirdim</span>
              </button>
            </>
          )}

          {status === 'done' && (
            <>
              <button
                type="button"
                onClick={() => onMoveStatus(topic.id, 'in_progress')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/25 transition"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Tekrar Çalış</span>
              </button>
              <button
                type="button"
                onClick={() => onMoveStatus(topic.id, 'todo')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                title="Başlangıca Al"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Sıfırla</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

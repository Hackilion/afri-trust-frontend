import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { WorkflowStep } from '../../types';

export type StepFlowNodeData = {
  step: WorkflowStep;
  title: string;
  accent: string;
  readOnly: boolean;
  onRemove?: () => void;
};

export type WfStepRfNode = Node<StepFlowNodeData, 'wfStep'>;

function StepFlowNode({ data, selected }: NodeProps<WfStepRfNode>) {
  const { step, title, accent, readOnly, onRemove } = data;
  return (
    <div
      className={`group relative min-w-[220px] max-w-[260px] rounded-2xl border-2 bg-white shadow-md transition-shadow ${
        selected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50' : ''
      } ${accent}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-slate-300 !bg-white"
      />
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                {step.order}
              </span>
              <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
            </div>
            {(step.stepType === 'custom' || step.stepType === 'webhook') && step.integrationKey && (
              <p className="mt-1.5 truncate font-mono text-[10px] text-slate-500">{step.integrationKey}</p>
            )}
            {step.label && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">{step.label}</p>
            )}
            {!step.required && (
              <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium uppercase text-slate-500">
                Optional
              </span>
            )}
          </div>
          {!readOnly && onRemove && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onRemove();
              }}
              className="rounded-lg p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              title="Remove step"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-slate-300 !bg-white"
      />
    </div>
  );
}

export default memo(StepFlowNode);

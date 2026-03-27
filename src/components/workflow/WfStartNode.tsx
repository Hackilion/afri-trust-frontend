import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { Play } from 'lucide-react';

type WfStartRfNode = Node<Record<string, never>, 'wfStart'>;

function WfStartNode({ selected }: NodeProps<WfStartRfNode>) {
  return (
    <div
      className={`relative flex items-center gap-2 rounded-2xl border-2 bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-2.5 text-white shadow-lg shadow-indigo-600/25 ${
        selected ? 'border-white ring-2 ring-indigo-300/60' : 'border-white/30'
      }`}
    >
      <Play size={14} className="opacity-90" fill="currentColor" />
      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Entry</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-indigo-900 !bg-white"
      />
    </div>
  );
}

export default memo(WfStartNode);

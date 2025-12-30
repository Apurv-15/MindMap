import React from 'react';
import { MindMapNodeData } from '../types';

interface TooltipProps {
  node: MindMapNodeData | null;
  position: { x: number; y: number } | null;
}

export const Tooltip: React.FC<TooltipProps> = ({ node, position }) => {
  if (!node || !position) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none transition-opacity duration-200"
      style={{
        left: position.x + 15,
        top: position.y + 15,
        maxWidth: '250px'
      }}
    >
      <div className="bg-[#121411]/90 backdrop-blur-md border border-[#e8e6e1]/10 rounded-lg p-3 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#00ffaa] animate-pulse" />
          <span className="font-mono text-[10px] text-[#00ffaa] uppercase tracking-wider">
            {node.metadata.type}
          </span>
        </div>
        <h3 className="text-sm font-bold text-[#e8e6e1] font-sans mb-1">{node.label}</h3>
        <p className="text-xs text-[#e8e6e1]/60 leading-relaxed font-mono">
          {node.description.length > 60 ? node.description.substring(0, 60) + '...' : node.description}
        </p>
      </div>
    </div>
  );
};

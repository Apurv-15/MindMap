import React, { useState, useEffect } from 'react';
import { MindMapNodeData } from '../types';
import { Icons } from './Icons';

interface SidePanelProps {
  node: MindMapNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<MindMapNodeData>) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ node, isOpen, onClose, onUpdate }) => {
  const [editForm, setEditForm] = useState<Partial<MindMapNodeData>>({});

  useEffect(() => {
    if (node) {
      setEditForm({
        label: node.label,
        description: node.description,
        metadata: { ...node.metadata }
      });
    }
  }, [node]);

  const handleChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      metadata: { ...prev.metadata!, [field]: value }
    }));
  };

  const handleSave = () => {
    if (node) {
      onUpdate(node.id, editForm);
    }
  };

  if (!node) return null;

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-[#060705]/80 backdrop-blur-xl border-l border-[#e8e6e1]/10 z-40 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ffaa]" />
            <span className="font-mono text-xs text-[#00ffaa]">NODE_DETAILS</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#e8e6e1]/60 hover:text-[#e8e6e1]"
          >
            <Icons.Close size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-20">
          
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-[#e8e6e1]/40 uppercase tracking-widest">Label</label>
            <input
              type="text"
              value={editForm.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full bg-[#121411] border border-[#e8e6e1]/10 rounded p-3 text-[#e8e6e1] focus:border-[#00ffaa] focus:outline-none transition-colors font-sans text-lg font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] text-[#e8e6e1]/40 uppercase tracking-widest">Description</label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-[#121411] border border-[#e8e6e1]/10 rounded p-3 text-[#e8e6e1]/80 focus:border-[#00ffaa] focus:outline-none transition-colors font-sans text-sm min-h-[120px] resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e8e6e1]/10">
             <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] text-[#e8e6e1]/40 uppercase tracking-widest">Status</label>
                <select 
                  value={editForm.metadata?.status || 'active'}
                  onChange={(e) => handleMetadataChange('status', e.target.value)}
                  className="bg-[#121411] text-[#00ffaa] text-xs font-mono border border-[#e8e6e1]/10 rounded px-2 py-1 focus:outline-none focus:border-[#00ffaa]"
                >
                  <option value="active">ACTIVE</option>
                  <option value="pending">PENDING</option>
                  <option value="completed">COMPLETED</option>
                </select>
             </div>

             <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#e8e6e1]/40 uppercase tracking-widest">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {editForm.metadata?.tags?.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-[#00ffaa]/10 border border-[#00ffaa]/20 rounded text-[#00ffaa] text-[10px] font-mono uppercase">
                      {tag}
                    </span>
                  ))}
                  <button className="px-2 py-1 bg-[#e8e6e1]/5 border border-[#e8e6e1]/10 rounded text-[#e8e6e1]/40 text-[10px] font-mono hover:bg-[#e8e6e1]/10 hover:text-[#e8e6e1] transition-colors">
                    + ADD
                  </button>
                </div>
             </div>
          </div>

          <div className="pt-4 border-t border-[#e8e6e1]/10">
            <h4 className="font-mono text-[10px] text-[#e8e6e1]/40 uppercase tracking-widest mb-3">Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#121411] p-3 rounded border border-[#e8e6e1]/5">
                <span className="block text-[#e8e6e1]/40 text-[10px] font-mono mb-1">CHILDREN</span>
                <span className="text-[#e8e6e1] font-mono">{node.children?.length || 0}</span>
              </div>
              <div className="bg-[#121411] p-3 rounded border border-[#e8e6e1]/5">
                <span className="block text-[#e8e6e1]/40 text-[10px] font-mono mb-1">DEPTH</span>
                <span className="text-[#e8e6e1] font-mono">{(node as any).depth || 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#060705] to-transparent">
          <button 
            onClick={handleSave}
            className="w-full py-3 bg-[#00ffaa] text-[#060705] font-bold uppercase tracking-wider text-xs hover:bg-[#00ccff] transition-colors duration-300 rounded"
          >
            Update Node
          </button>
        </div>
      </div>
    </div>
  );
};

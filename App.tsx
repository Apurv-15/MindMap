import React, { useState, useCallback, useMemo, useEffect } from 'react';
import initialDataRaw from './data.json';
import { MindMapNodeData } from './types';
import { MindMapCanvas } from './components/MindMapCanvas';
import { SidePanel } from './components/SidePanel';
import { Tooltip } from './components/Tooltip';
import { GrainOverlay } from './components/GrainOverlay';
import { Icons } from './components/Icons';

const initialData = initialDataRaw as unknown as MindMapNodeData;

export default function App() {
  const [data, setData] = useState<MindMapNodeData>(() => {
    // Deep clone to avoid mutating the original import
    const d = JSON.parse(JSON.stringify(initialData)) as MindMapNodeData;

    // Recursive helper to collapse nodes
    const collapseRecursively = (node: MindMapNodeData) => {
      if (node.children && node.children.length > 0) {
        node._children = node.children;
        node.children = undefined;
        node.collapsed = true;
        // Continue collapsing deeper levels just in case they get expanded later
        node._children.forEach(collapseRecursively);
      }
    };

    // Collapse all children of the root (preserving level 1 visibility)
    if (d.children) {
      d.children.forEach(child => collapseRecursively(child));
    }

    return d;
  });

  // Sync state with data.json updates (HMR support)
  useEffect(() => {
    setData(initialData);
  }, [initialDataRaw]);
  const [drillPath, setDrillPath] = useState<string[]>(['root']);
  const [selectedNode, setSelectedNode] = useState<MindMapNodeData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ node: MindMapNodeData | null; pos: { x: number; y: number } | null }>({ node: null, pos: null });
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showDocs, setShowDocs] = useState(false);

  // Helper to find node including hidden children (deep search)
  const findNode = (root: MindMapNodeData, id: string): MindMapNodeData | null => {
    if (root.id === id) return root;
    const children = [...(root.children || []), ...(root._children || [])];
    for (const child of children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  // Compute the current root node based on drill path
  const currentRoot = useMemo(() => {
    const rootId = drillPath[drillPath.length - 1];
    return findNode(data, rootId) || data;
  }, [data, drillPath]);

  // Deep clone data helper
  const cloneData = (node: MindMapNodeData): MindMapNodeData => JSON.parse(JSON.stringify(node));

  // Modify node in the master tree
  const modifyNode = (root: MindMapNodeData, id: string, callback: (node: MindMapNodeData) => void): MindMapNodeData => {
    const newRoot = cloneData(root);
    // Stack based traversal that includes hidden children
    const stack = [newRoot];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current.id === id) {
        callback(current);
        return newRoot;
      }
      if (current.children) stack.push(...current.children);
      if (current._children) stack.push(...current._children);
    }
    return newRoot;
  };

  const handleNodeClick = useCallback((node: MindMapNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  const handleNodeDoubleClick = useCallback((node: MindMapNodeData) => {
    // Expand the node we're drilling into if it's collapsed
    if (node._children && !node.children) {
      setData(prev => modifyNode(prev, node.id, (n) => {
        n.children = n._children;
        n._children = undefined;
        n.collapsed = false;
      }));
    }

    // Allow drilling into any node regardless of children (Focus Mode)
    setDrillPath(prev => [...prev, node.id]);
    setFitViewTrigger(n => n + 1); // Auto fit view on drill
    setSelectedNode(null); // Clear selection
  }, []);

  const handleDrillDownButton = useCallback(() => {
    if (selectedNode) {
      handleNodeDoubleClick(selectedNode);
    }
  }, [selectedNode, handleNodeDoubleClick]);

  const handleDrillUp = useCallback(() => {
    if (drillPath.length > 1) {
      // Get the node we're currently viewing (the one we're drilling up from)
      const currentNodeId = drillPath[drillPath.length - 1];

      // Expand it in the parent view so user can see where they were
      setData(prev => modifyNode(prev, currentNodeId, (node) => {
        if (node._children && !node.children) {
          node.children = node._children;
          node._children = undefined;
          node.collapsed = false;
        }
      }));

      setDrillPath(prev => prev.slice(0, -1));
      setFitViewTrigger(n => n + 1);
    }
  }, [drillPath]);

  const handleBreadcrumbClick = (index: number) => {
    setDrillPath(prev => prev.slice(0, index + 1));
    setFitViewTrigger(n => n + 1);
  };

  const handleNodeHover = useCallback((node: MindMapNodeData | null, pos: { x: number; y: number } | null) => {
    setHoverInfo({ node, pos });
  }, []);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setData(prev => modifyNode(prev, nodeId, (node) => {
      if (node.children) {
        node._children = node.children;
        node.children = undefined;
        node.collapsed = true;
      } else {
        node.children = node._children;
        node._children = undefined;
        node.collapsed = false;
      }
    }));
  }, []);

  const handleExpandAll = useCallback(() => {
    const expandRecursively = (node: MindMapNodeData) => {
      if (node._children && node._children.length > 0) {
        node.children = node.children ? [...node.children, ...node._children] : node._children;
        node._children = undefined;
        node.collapsed = false;
      }
      if (node.children) {
        node.children.forEach(expandRecursively);
      }
    };

    setData(prev => modifyNode(prev, currentRoot.id, (node) => {
      expandRecursively(node);
    }));
    setFitViewTrigger(n => n + 1);
  }, [currentRoot.id]);

  const handleCollapseAll = useCallback(() => {
    const collapseRecursively = (node: MindMapNodeData, isRoot: boolean) => {
      if (!isRoot && node.children && node.children.length > 0) {
        node._children = node.children;
        node.children = undefined;
        node.collapsed = true;
      }

      // Also ensure deep children are collapsed
      const targets = node.children || node._children;
      if (targets) {
        targets.forEach(child => collapseRecursively(child, false));
      }
    };

    setData(prev => modifyNode(prev, currentRoot.id, (node) => {
      collapseRecursively(node, true);
    }));
    setFitViewTrigger(n => n + 1);
  }, [currentRoot.id]);


  const handleAddNode = useCallback(() => {
    const targetNodeId = selectedNode ? selectedNode.id : currentRoot.id;
    const newNode: MindMapNodeData = {
      id: `node-${Date.now()}`,
      label: 'New Node',
      description: 'Newly created node.',
      metadata: {
        type: 'concept',
        status: 'active',
        tags: [],
        created: new Date().toISOString(),
      }
    };

    setData(prev => modifyNode(prev, targetNodeId, (node) => {
      // Ensure children array exists
      if (!node.children && !node._children) {
        node.children = [];
      }

      // Add to visible children if expanded, or hidden if collapsed
      if (node.children) {
        node.children.push(newNode);
      } else if (node._children) {
        node._children.push(newNode);
      }

      // If we added to hidden (collapsed), let's expand it so user sees the new node
      if (node._children && !node.children) {
        node.children = node._children;
        node._children = undefined;
        node.collapsed = false;
      }
    }));

    // Trigger fit view or just let user see it
    // setFitViewTrigger(n => n + 1);
  }, [selectedNode, currentRoot.id]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode || selectedNode.id === 'root') return;

    // Prevent deleting nodes in the current drill path to avoid view state inconsistencies
    if (drillPath.includes(selectedNode.id)) {
      alert("Cannot delete a node that is part of the current navigation path.");
      return;
    }

    setData(prev => {
      const newData = cloneData(prev);

      const deleteFromChildren = (parentNode: MindMapNodeData): boolean => {
        if (parentNode.children) {
          const index = parentNode.children.findIndex(c => c.id === selectedNode.id);
          if (index !== -1) {
            parentNode.children.splice(index, 1);
            return true;
          }
          if (parentNode.children.some(deleteFromChildren)) return true;
        }
        if (parentNode._children) {
          const index = parentNode._children.findIndex(c => c.id === selectedNode.id);
          if (index !== -1) {
            parentNode._children.splice(index, 1);
            return true;
          }
          if (parentNode._children.some(deleteFromChildren)) return true;
        }
        return false;
      };

      deleteFromChildren(newData);
      return newData;
    });

    setSelectedNode(null);
    setIsPanelOpen(false);
  }, [selectedNode, drillPath]);


  const handleDownload = useCallback(() => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "mindmap_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);


  const handleUpdateNode = useCallback((id: string, updates: Partial<MindMapNodeData>) => {
    setData(prev => {
      const newData = modifyNode(prev, id, (node) => {
        Object.assign(node, updates);
        if (updates.metadata) {
          node.metadata = { ...node.metadata, ...updates.metadata };
        }
      });

      // Update selection if needed
      const findSelected = (root: MindMapNodeData): MindMapNodeData | null => {
        if (root.id === id) return root;
        const kids = [...(root.children || []), ...(root._children || [])];
        for (const k of kids) {
          const f = findSelected(k);
          if (f) return f;
        }
        return null;
      };
      const updatedSelected = findSelected(newData);
      if (updatedSelected) setSelectedNode(updatedSelected);

      return newData;
    });
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#060705] overflow-hidden text-[#e8e6e1] selection:bg-[#00ffaa] selection:text-[#060705]">
      <GrainOverlay />

      {/* Header & Breadcrumbs & Toolbar */}
      <nav className="fixed top-0 left-0 p-8 z-40 w-full pointer-events-none">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter mb-1 font-sans">MYCELIUM_MIND</h1>
            <div className="flex items-center gap-2 font-mono text-xs text-[#00ffaa]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffaa] animate-pulse" />
              ACTIVE EXPANSION // SECTOR 09-X
            </div>
          </div>
        </div>

        {/* Toolbar - Pointer events auto to allow clicking */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto mb-4">

          {/* Expand/Collapse Group */}
          <button onClick={handleExpandAll} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors shadow-lg shadow-indigo-500/20 font-medium text-sm">
            <Icons.FolderOpen size={16} />
            <span>Expand All</span>
          </button>
          <button onClick={handleCollapseAll} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors shadow-lg shadow-teal-600/20 font-medium text-sm">
            <Icons.Folder size={16} />
            <span>Collapse All</span>
          </button>

          {/* Drill Group */}
          <button
            onClick={handleDrillDownButton}
            disabled={!selectedNode}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors shadow-lg font-medium text-sm
              ${!selectedNode
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20'}`}
            title={!selectedNode ? "Select a node first to drill down" : "Focus on selected node's subtree"}
          >
            <Icons.ArrowDown size={16} />
            <span>Drill Down</span>
          </button>
          <button
            onClick={handleDrillUp}
            disabled={drillPath.length <= 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors shadow-lg font-medium text-sm
              ${drillPath.length <= 1
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20'}`}
            title={drillPath.length <= 1 ? "Already at root level" : "Go back to parent view"}
          >
            <Icons.ArrowUp size={16} />
            <span>Drill Up</span>
          </button>

          {/* Actions */}
          <button onClick={() => setFitViewTrigger(n => n + 1)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors shadow-lg shadow-pink-600/20 font-medium text-sm">
            <Icons.Target size={16} />
            <span>Fit View</span>
          </button>

          <button onClick={handleAddNode} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors shadow-lg shadow-cyan-600/20 font-medium text-sm">
            <Icons.Plus size={16} />
            <span>Add Node</span>
          </button>

          <button
            onClick={handleDeleteNode}
            disabled={!selectedNode || selectedNode.id === 'root'}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors shadow-lg font-medium text-sm
                    ${(!selectedNode || selectedNode.id === 'root')
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'}`}
          >
            <Icons.Trash size={16} />
            <span>Delete Node</span>
          </button>

          <button onClick={() => setShowDocs(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-lg shadow-green-600/20 font-medium text-sm">
            <Icons.FileText size={16} />
            <span>Full Documentation</span>
          </button>
        </div>

        {/* Second Row Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors shadow-lg shadow-teal-600/20 font-medium text-sm">
            <Icons.Save size={16} />
            <span>Download</span>
          </button>
        </div>


        {/* Breadcrumb Bar - Moved below toolbar */}
        <div className="mt-4 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleBreadcrumbClick(0)}
            className={`p-1.5 rounded hover:bg-[#e8e6e1]/10 transition-colors ${drillPath.length === 1 ? 'text-[#00ffaa]' : 'text-[#e8e6e1]/60'}`}
          >
            <Icons.Home size={16} />
          </button>

          {drillPath.map((id, index) => {
            if (index === 0) return null; // Root handled by Home icon
            const node = findNode(data, id);
            return (
              <div key={id} className="flex items-center gap-2 animate-fadeIn">
                <Icons.ChevronRight size={12} className="text-[#e8e6e1]/20" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`
                                text-xs font-mono px-2 py-1 rounded border transition-all
                                ${index === drillPath.length - 1
                      ? 'bg-[#00ffaa]/10 border-[#00ffaa]/30 text-[#00ffaa]'
                      : 'bg-transparent border-transparent text-[#e8e6e1]/60 hover:bg-[#e8e6e1]/5 hover:text-[#e8e6e1]'}
                            `}
                >
                  {node?.label || id}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="w-full h-full relative z-10" onClick={() => { setIsPanelOpen(false); setSelectedNode(null); }}>
        <MindMapCanvas
          data={currentRoot}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeHover={handleNodeHover}
          onToggleCollapse={handleToggleCollapse}
          triggerFitView={fitViewTrigger}
          triggerReset={resetTrigger}
          selectedNodeId={selectedNode?.id || null}
          canDrillUp={drillPath.length > 1}
          onDrillUp={handleDrillUp}
        />
      </main>

      {/* Bottom Controls (Reset only now) */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setResetTrigger(n => n + 1)}
          className="p-3 bg-[#121411]/80 backdrop-blur text-[#e8e6e1] hover:bg-[#e8e6e1] hover:text-[#060705] transition-all rounded-full border border-[#e8e6e1]/10"
          title="Reset View"
        >
          <Icons.Reset size={20} />
        </button>
      </div>


      {/* Docs Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8" onClick={() => setShowDocs(false)}>
          <div className="bg-[#121411] border border-[#e8e6e1]/20 p-8 rounded-lg max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-[#e8e6e1]/50 hover:text-white" onClick={() => setShowDocs(false)}>
              <Icons.Close size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-[#00ffaa] font-sans">Documentation</h2>
            <div className="space-y-4 text-[#e8e6e1]/80 font-mono text-sm leading-relaxed h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              <p>Welcome to Mycelium Mind.</p>
              <h3 className="text-white font-bold mt-4">Controls</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Drag</strong> background to pan.</li>
                <li><strong>Scroll</strong> to zoom.</li>
                <li><strong>Click</strong> a node to view details in the side panel.</li>
                <li><strong>Double Click</strong> a node to drill down into its subtree.</li>
                <li><strong>Hover</strong> over a node and click the small "Drill Down" arrow to focus.</li>
                <li><strong>Click "DRILL UP"</strong> above the root node to go back.</li>
              </ul>
              <h3 className="text-white font-bold mt-4">Node Types</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-[#00ffaa]">Concept</span>: Core ideas and groupings.</li>
                <li><span className="text-[#00ccff]">Task</span>: Actionable items.</li>
                <li><span className="text-[#e8e6e1]">Note</span>: Information and annotations.</li>
              </ul>
              <h3 className="text-white font-bold mt-4">Editing</h3>
              <p>Select a node to edit its label, description, and status in the right-side panel.</p>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      <SidePanel
        node={selectedNode}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onUpdate={handleUpdateNode}
      />

      <Tooltip node={hoverInfo.node} position={hoverInfo.pos} />
    </div>
  );
}
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { MindMapNodeData } from '../types';
import { Icons } from './Icons';

interface MindMapCanvasProps {
  data: MindMapNodeData;
  onNodeClick: (node: MindMapNodeData) => void;
  onNodeDoubleClick: (node: MindMapNodeData) => void;
  onNodeHover: (node: MindMapNodeData | null, pos: { x: number; y: number } | null) => void;
  onToggleCollapse: (nodeId: string) => void;
  triggerFitView: number; // Increment to trigger
  triggerReset: number; // Increment to trigger
  selectedNodeId: string | null;
  canDrillUp?: boolean;
  onDrillUp?: () => void;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  data,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
  onToggleCollapse,
  triggerFitView,
  triggerReset,
  selectedNodeId,
  canDrillUp,
  onDrillUp
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process data into D3 hierarchy
  const root = useMemo(() => {
    const hierarchy = d3.hierarchy(data);
    
    // Set tree layout settings
    // Increasing the separation for better visual spacing
    const treeLayout = d3.tree<MindMapNodeData>()
      .nodeSize([80, 240]) // [height, width] - flipped because vertical size determines Y spacing
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 2) / (a.depth === 0 ? 1 : 1));

    const rootNode = treeLayout(hierarchy);
    
    // Center the root initially
    // We don't shift x/y here, we rely on zoom transform to center
    return rootNode;
  }, [data, dimensions]);

  // D3 Zoom behavior
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.zoom-container');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    // Disable double click zoom
    svg.on("dblclick.zoom", null);

    // Initial center or reset
    if (triggerFitView > 0 || triggerReset > 0) {
       // Calculate bounding box of the tree
       let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
       root.descendants().forEach(d => {
         minX = Math.min(minX, d.y); // Note: d.y is horizontal in horizontal tree
         maxX = Math.max(maxX, d.y);
         minY = Math.min(minY, d.x); // d.x is vertical
         maxY = Math.max(maxY, d.x);
       });

       // Add node dimensions (approx)
       const nodeWidth = 200;
       const nodeHeight = 80;
       
       const width = maxX - minX + nodeWidth * 2;
       const height = maxY - minY + nodeHeight * 2;
       
       const midX = (minX + maxX) / 2;
       const midY = (minY + maxY) / 2;
       
       const scale = Math.min(
         0.9, 
         Math.min(dimensions.width / width, dimensions.height / height)
       );

       svg.transition().duration(750).call(
         zoom.transform,
         d3.zoomIdentity
           .translate(dimensions.width / 2, dimensions.height / 2)
           .scale(scale)
           .translate(-midX, -midY)
       );
    }

  }, [root, dimensions, triggerFitView, triggerReset]);


  // Helper for curved links
  const linkGenerator = d3.linkHorizontal<d3.HierarchyPointLink<MindMapNodeData>, d3.HierarchyPointNode<MindMapNodeData>>()
    .x(d => d.y)
    .y(d => d.x);

  return (
    <div ref={wrapperRef} className="w-full h-full relative overflow-hidden bg-radial-gradient">
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="zoom-container">
          
          {/* Links */}
          <g className="links">
            {root.links().map((link, i) => {
               const isSelectedPath = selectedNodeId === link.target.data.id || selectedNodeId === link.source.data.id;
               return (
                <path
                  key={`${link.source.data.id}-${link.target.data.id}`}
                  d={linkGenerator(link) || ''}
                  fill="none"
                  stroke={isSelectedPath ? "#00ffaa" : "#e8e6e1"}
                  strokeWidth={isSelectedPath ? 2 : 1}
                  strokeOpacity={isSelectedPath ? 0.8 : 0.2}
                  className="transition-all duration-500 ease-out"
                  style={{ 
                    filter: isSelectedPath ? 'url(#glow)' : 'none'
                  }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {root.descendants().map((node) => {
              const isSelected = selectedNodeId === node.data.id;
              const hasChildren = (node.data.children && node.data.children.length > 0) || (node.data._children && node.data._children.length > 0);
              const isRoot = node.depth === 0;

              return (
                <foreignObject
                  key={node.data.id}
                  x={node.y - 100} // Center horizontally (width 200)
                  y={node.x - 40}  // Center vertically (height 80)
                  width={200}
                  height={80}
                  className="overflow-visible"
                >
                  <div className="relative w-full h-full">
                    
                    {/* Drill Up Button for Root */}
                    {isRoot && canDrillUp && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDrillUp?.(); }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-[#060705] border border-[#00ffaa] text-[#00ffaa] text-[10px] rounded-full hover:bg-[#00ffaa] hover:text-[#060705] transition-colors z-50 shadow-[0_0_15px_rgba(0,255,170,0.3)] backdrop-blur-md cursor-pointer"
                        >
                            <Icons.ArrowUp size={12} strokeWidth={3} />
                            <span className="font-mono font-bold tracking-wider">DRILL UP</span>
                        </button>
                    )}

                    <div
                        className={`
                        relative w-full h-full flex flex-col justify-center px-4 py-2
                        border rounded-sm backdrop-blur-md transition-all duration-300
                        group
                        ${isRoot ? 'bg-[#121411]/90 border-[#00ffaa]/50 shadow-[0_0_30px_rgba(0,255,170,0.2)]' : 'bg-[#121411]/60 border-[#e8e6e1]/10 hover:border-[#00ffaa]/50'}
                        ${isSelected ? 'border-[#00ffaa] shadow-[0_0_20px_rgba(0,255,170,0.15)] scale-105' : ''}
                        `}
                        onClick={(e) => {
                        e.stopPropagation();
                        onNodeClick(node.data);
                        }}
                        onDoubleClick={(e) => {
                        e.stopPropagation();
                        onNodeDoubleClick(node.data);
                        }}
                        onMouseEnter={(e) => onNodeHover(node.data, { x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => onNodeHover(null, null)}
                    >
                        {/* Connection Node (Dot) */}
                        {hasChildren && (
                        <button
                            className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center
                            bg-[#060705] border border-[#00ffaa]/50 text-[#00ffaa] hover:bg-[#00ffaa] hover:text-[#060705] transition-all z-20
                            ${node.data.collapsed ? 'bg-[#00ffaa] text-[#060705] animate-pulse' : ''}
                            `}
                            onClick={(e) => {
                            e.stopPropagation();
                            onToggleCollapse(node.data.id);
                            }}
                        >
                            {node.data.collapsed ? <span className="text-[10px] font-bold">+</span> : <span className="text-[10px] font-bold">-</span>}
                        </button>
                        )}

                        {/* Drill Down Button (Top Right corner) */}
                        {!isRoot && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onNodeDoubleClick(node.data); }}
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#060705] border border-[#00ccff] text-[#00ccff] rounded-full p-1 hover:bg-[#00ccff] hover:text-[#060705] scale-75 hover:scale-100 z-50 shadow-[0_0_10px_rgba(0,204,255,0.3)]"
                                title="Drill Down / Focus"
                            >
                                <Icons.ArrowDown size={14} />
                            </button>
                        )}

                        <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px] text-[#00ffaa] uppercase opacity-70">
                            {node.data.metadata.type}
                        </span>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#00ffaa] animate-ping" />}
                        </div>
                        
                        <h3 className={`font-bold text-[#e8e6e1] truncate ${isRoot ? 'text-lg' : 'text-sm'}`}>
                        {node.data.label}
                        </h3>
                        
                        {/* Decorative Corner */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#e8e6e1]/20 rounded-tl-sm" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#e8e6e1]/20 rounded-br-sm" />
                    </div>
                  </div>
                </foreignObject>
              );
            })}
          </g>

        </g>
      </svg>
    </div>
  );
};
import { HierarchyPointNode } from 'd3';

export interface NodeMetadata {
  type: 'concept' | 'task' | 'note' | 'root';
  status: 'active' | 'completed' | 'pending';
  tags: string[];
  created: string;
}

export interface MindMapNodeData {
  id: string;
  label: string;
  description: string;
  metadata: NodeMetadata;
  children?: MindMapNodeData[];
  _children?: MindMapNodeData[]; // Store for collapsed children
  inputs?: string[];
  outputs?: string[];
  collapsed?: boolean; // UI state persisted in data for simplicity
}

// Helper type for D3 Hierarchy
export interface HierarchyNode extends HierarchyPointNode<MindMapNodeData> {
  x: number;
  y: number;
}
import { MindMapNodeData } from './types';

export const INITIAL_DATA: MindMapNodeData = {
  id: 'root',
  label: 'Central Spore',
  description: 'The origin point of the neural mycelium network.',
  metadata: {
    type: 'root',
    status: 'active',
    tags: ['origin', 'core'],
    created: new Date().toISOString(),
  },
  children: [
    {
      id: 'c1',
      label: 'Neural Plasticity',
      description: 'Ability of the network to reorganize itself.',
      metadata: { type: 'concept', status: 'active', tags: ['brain', 'adaptation'], created: new Date().toISOString() },
      children: [
        {
          id: 'c1-1',
          label: 'Synaptic Pruning',
          description: 'Removal of weak connections.',
          metadata: { type: 'task', status: 'pending', tags: ['optimization'], created: new Date().toISOString() },
        },
        {
          id: 'c1-2',
          label: 'Axonal Growth',
          description: 'Extension of new pathways.',
          metadata: { type: 'concept', status: 'active', tags: ['growth'], created: new Date().toISOString() },
        }
      ]
    },
    {
      id: 'c2',
      label: 'Substrate Synthesis',
      description: 'Processing raw data into usable patterns.',
      metadata: { type: 'concept', status: 'active', tags: ['data', 'processing'], created: new Date().toISOString() },
      children: [
        {
          id: 'c2-1',
          label: 'Raw Ingestion',
          description: 'Intake of unstructured signals.',
          metadata: { type: 'task', status: 'completed', tags: ['input'], created: new Date().toISOString() },
        },
        {
          id: 'c2-2',
          label: 'Pattern Matching',
          description: 'Identifying recurring sequences.',
          metadata: { type: 'concept', status: 'active', tags: ['analysis'], created: new Date().toISOString() },
          children: [
             {
              id: 'c2-2-1',
              label: 'Anomaly Detection',
              description: 'Flagging irregularities in the stream.',
              metadata: { type: 'note', status: 'active', tags: ['security'], created: new Date().toISOString() },
            }
          ]
        }
      ]
    },
    {
      id: 'c3',
      label: 'Biolume Feedback',
      description: 'Visual signaling of network health.',
      metadata: { type: 'concept', status: 'active', tags: ['ui', 'feedback'], created: new Date().toISOString() },
      children: [
        {
          id: 'c3-1',
          label: 'Pulse Rate',
          description: 'Frequency of updates.',
          metadata: { type: 'note', status: 'active', tags: ['metrics'], created: new Date().toISOString() },
        }
      ]
    }
  ]
};


export interface VisualElement {
  type: 'diagram' | 'scribble' | 'icon' | 'mindmap' | 'flowchart' | 'quote' | 'other';
  description: string;
}

export interface VisualNoteSection {
  title: string;
  summary: string;
  keyPoints: string[];
  visual: VisualElement;
}

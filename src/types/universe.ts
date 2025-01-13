export interface Planet {
  id: string;
  name: string;
  value: number;
  color: string;
  size: number;
  position: [number, number, number];
}

export interface TableProps {
  collapsed: boolean;
  onToggle: () => void;
}
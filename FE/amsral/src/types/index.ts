export type NavigationItem = {
  kind?: 'header' | 'divider';
  title?: string;
  segment?: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
};
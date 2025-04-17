'use client';

import { ReactNode } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualizedListProps<T> {
  items: T[];
  height?: number;
  itemSize: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  className?: string;
  overscanCount?: number;
}

export default function VirtualizedList<T>({
  items,
  height = 500,
  itemSize,
  renderItem,
  className = '',
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  // Row renderer for react-window
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return renderItem(item, index, style);
  };

  return (
    <div className={`${className}`} style={{ height }}>
      <AutoSizer>
        {({ width, height: autoHeight }) => (
          <FixedSizeList
            height={height || autoHeight}
            width={width}
            itemCount={items.length}
            itemSize={itemSize}
            overscanCount={overscanCount}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}

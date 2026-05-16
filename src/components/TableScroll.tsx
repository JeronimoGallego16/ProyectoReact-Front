import React from 'react';

type TableScrollProps = {
  children: React.ReactNode;
  /** CSS value for max-height (e.g. '60vh' or '400px') */
  maxHeight?: string;
  /** Additional class for inner table wrapper (e.g. to set min-width) */
  className?: string;
  /** Additional class for outer wrapper */
  wrapperClassName?: string;
};

const TableScroll: React.FC<TableScrollProps> = ({
  children,
  maxHeight = '60vh',
  className = '',
  wrapperClassName = '',
}) => {
  return (
    <div className={`w-full ${wrapperClassName}`}>
      <div className="overflow-auto" style={{ maxHeight }}>
        <div className={`min-w-full ${className}`}>{children}</div>
      </div>
    </div>
  );
};

export default TableScroll;

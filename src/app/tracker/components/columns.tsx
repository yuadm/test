'use client';

import Link from 'next/link';

// Define column type for the document tracker table
// Since we don't have @tanstack/react-table, we'll create a simpler column definition
type ColumnDef<T> = {
  accessorKey?: string;
  id?: string;
  header: string;
  cell?: (props: { row: { getValue: (key: string) => any; original: T } }) => React.ReactNode;
};

type Document = {
  id: string;
  employee_id: string;
  document_type: string;
  status: string;
  country: string;
  expiry_date: string | null;
  notes: string | null;
  employee_name: string;
  employee_code: string;
};

export const columns: ColumnDef<Document>[] = [
  {
    accessorKey: 'employee_name',
    header: 'Employee Name',
  },
  {
    accessorKey: 'employee_code',
    header: 'Employee Code',
  },
  {
    accessorKey: 'document_type',
    header: 'Document Type',
    cell: ({ row }) => {
      const documentType = row.getValue('document_type') as string;
      return (
        <div className="font-medium">
          {documentType.charAt(0).toUpperCase() + documentType.slice(1).replace('_', ' ')}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      let className = 'px-2 py-1 rounded-full text-xs font-medium';
      
      switch (status) {
        case 'BRITISH':
          className += ' bg-blue-100 text-blue-800';
          break;
        case 'EU':
          className += ' bg-green-100 text-green-800';
          break;
        case 'NON-EU':
          className += ' bg-yellow-100 text-yellow-800';
          break;
        default:
          className += ' bg-gray-100 text-gray-800';
      }
      
      return (
        <span className={className}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'country',
    header: 'Country',
  },
  {
    accessorKey: 'expiry_date',
    header: 'Expiry Date',
    cell: ({ row }) => {
      const expiryDate = row.getValue('expiry_date') as string | null;
      
      if (!expiryDate) return <span className="text-gray-500">N/A</span>;
      
      const formattedDate = new Date(expiryDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      
      // Calculate days until expiry
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let textColorClass = 'text-green-600';
      if (diffDays < 0) {
        textColorClass = 'text-red-600 font-bold';
      } else if (diffDays <= 30) {
        textColorClass = 'text-orange-600 font-bold';
      } else if (diffDays <= 90) {
        textColorClass = 'text-yellow-600';
      }
      
      return (
        <div className={textColorClass}>
          {formattedDate}
          {diffDays < 0 ? (
            <div className="text-xs text-red-600">Expired {Math.abs(diffDays)} days ago</div>
          ) : (
            <div className="text-xs">{diffDays} days remaining</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => {
      const notes = row.getValue('notes') as string | null;
      if (!notes) return null;
      
      return (
        <div className="max-w-[200px] truncate" title={notes}>
          {notes}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const document = row.original;
      
      return (
        <div className="flex space-x-2">
          <Link href={`/tracker/${document.id}/edit`}>
            <button className="text-blue-600 hover:text-blue-800">
              Edit
            </button>
          </Link>
          <button className="text-red-600 hover:text-red-800">
            Delete
          </button>
        </div>
      );
    },
  },
];

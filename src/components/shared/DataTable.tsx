import { Pencil, Trash2, Copy } from 'lucide-react';
import IconButton from './IconButton';
import './DataTable.css';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onDuplicate?: (item: T) => void;
  idKey?: keyof T;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onEdit,
  onDelete,
  onDuplicate,
  idKey = 'id' as keyof T,
}: DataTableProps<T>) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {(onEdit || onDelete || onDuplicate) && <th className="actions-header">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete || onDuplicate ? 1 : 0)} className="no-data">
                No data available
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={String(item[idKey])}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : String(item[col.key])}
                  </td>
                ))}
                {(onEdit || onDelete || onDuplicate) && (
                  <td className="actions">
                    {onEdit && (
                      <IconButton
                        icon={Pencil}
                        label="Edit"
                        onClick={() => onEdit(item)}
                        variant="edit"
                      />
                    )}
                    {onDuplicate && (
                      <IconButton
                        icon={Copy}
                        label="Duplicate"
                        onClick={() => onDuplicate(item)}
                        variant="duplicate"
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        icon={Trash2}
                        label="Delete"
                        onClick={() => onDelete(item)}
                        variant="danger"
                      />
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

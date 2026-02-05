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
                      <button
                        onClick={() => onEdit(item)}
                        className="btn btn-edit"
                      >
                        Edit
                      </button>
                    )}
                    {onDuplicate && (
                      <button
                        onClick={() => onDuplicate(item)}
                        className="btn btn-duplicate"
                      >
                        Duplicate
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="btn btn-delete"
                      >
                        Delete
                      </button>
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

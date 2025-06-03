import React from 'react';
import { ChevronDown, ChevronUp, Paperclip } from 'lucide-react'; //Chevron para ordenar, Paperclip para comprobantes

// Definición de una columna
export interface Column<T> {
  key: keyof T | 'actions' | 'custom'; // Clave del objeto de datos, o 'actions'/'custom' para columnas especiales
  header: string; // Texto del encabezado
  className?: string; // Clases Tailwind para la celda (td y th)
  headerClassName?: string; // Clases específicas para el encabezado (th)
  sortable?: boolean; // Si la columna es ordenable
  renderCell?: (item: T, index: number) => React.ReactNode; // Función personalizada para renderizar la celda
  // Para columnas que no mapean directamente a una `key` de `T` pero necesitan `item`
  customRender?: (item: T) => React.ReactNode; 
}

// Props del componente ReusableTable
interface ReusableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number; // Función para extraer una clave única de cada item
  // Props de ordenamiento
  sortColumn?: keyof T | string | null;
  sortOrder?: 'asc' | 'desc' | null;
  onSort?: (columnKey: keyof T | string) => void;
  // Clases personalizadas para la tabla y sus partes
  tableClassName?: string;
  headerRowClassName?: string;
  bodyRowClassName?: string;
  emptyStateMessage?: string;
}

function ReusableTable<T extends {}>({ 
  columns,
  data,
  onRowClick,
  keyExtractor,
  sortColumn,
  sortOrder,
  onSort,
  tableClassName = 'min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg',
  headerRowClassName = '',
  bodyRowClassName = 'hover:bg-gray-50 transition-colors duration-150',
  emptyStateMessage = 'No hay datos disponibles.'
}: ReusableTableProps<T>) {

  const handleSort = (columnKey: keyof T | string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className={tableClassName}>
        <thead className="bg-gray-50">
          <tr className={headerRowClassName}>
            {columns.map((col) => (
              <th 
                key={String(col.key)} 
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.headerClassName || ''} ${col.className || ''} ${col.sortable ? 'cursor-pointer' : ''}`}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              >
                <div className="flex items-center">
                  {col.header}
                  {col.sortable && sortColumn === col.key && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                  {col.sortable && sortColumn !== col.key && (
                     // Espacio reservado o ícono de ordenamiento genérico si no está activa
                    <span className="ml-1 opacity-30">
                       <ChevronDown size={14} /> 
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500 whitespace-nowrap">
                {emptyStateMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr 
                key={keyExtractor(item)} 
                onClick={() => onRowClick && onRowClick(item)}
                className={`${bodyRowClassName} ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={`${String(col.key)}-${rowIndex}`} className={`px-4 py-3 whitespace-nowrap text-sm text-gray-700 ${col.className || ''}`}>
                    {col.renderCell 
                      ? col.renderCell(item, rowIndex) 
                      : col.customRender 
                        ? col.customRender(item)
                        : col.key === 'actions' || col.key === 'custom' 
                          ? '' // Render nothing by default for action/custom if no renderCell/customRender
                          : String(item[col.key as keyof T] ?? 'N/A')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ReusableTable; 
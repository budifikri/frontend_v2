import React from 'react';

export default function TableTemplate({
  title,
  headers = [],
  data = [],
  onRowClick,
  selectedRow,
  children,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="glossy-header text-white text-sm uppercase tracking-wider font-semibold">
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className={`px-6 py-4 border-r border-slate-600/30 ${
                    header.width ? `w-${header.width}` : ''
                  }`}
                  style=""
                >
                  <div className="flex items-center gap-2" style="">
                    {header.label}
                    {header.icon ? (
                      <span 
                        className="material-icons-round text-xs" 
                        style={header.sortable ? "opacity-50" : "text-primary"}
                      >
                        {header.sortable ? "unfold_more" : "expand_more"}
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`
                  ${rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  ${rowIndex === selectedRow ? "bg-primary text-white shadow-inner" : ""}
                  border-b border-slate-100 hover:bg-slate-50 transition-colors
                `}
                style=""
                onClick={() => onRowClick && onRowClick(rowIndex)}
              >
                {headers.map((header, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`px-6 py-4 ${
                      rowIndex === selectedRow ? "" : "text-slate-700"
                    }`}
                    style=""
                  >
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex-grow"></div>
    </div>
  );
}
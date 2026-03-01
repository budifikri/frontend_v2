import React from 'react';
import TableTemplate from './TableTemplate';
import FormTemplate from './FormTemplate';

export default function TableFormTemplate({
  tableTitle,
  formTitle,
  formSubtitle,
  formIcon,
  headers,
  data,
  selectedRow,
  onRowClick,
  onSubmit,
  onCancel,
  isEditing = false,
  formFields,
  submitText = "Simpan",
  cancelText = "Batal",
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
          <h1 className="text-2xl font-bold tracking-tight uppercase text-slate-800" style="">
            {tableTitle}
          </h1>
        </div>
      </header>

      {/* Table */}
      <TableTemplate
        title={tableTitle}
        headers={headers}
        data={data}
        onRowClick={onRowClick}
        selectedRow={selectedRow}
      />

      {/* Form */}
      <FormTemplate
        title={formTitle}
        subtitle={formSubtitle}
        icon={formIcon}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isEditing={isEditing}
        submitText={submitText}
        cancelText={cancelText}
      >
        {formFields}
      </FormTemplate>
    </div>
  );
}
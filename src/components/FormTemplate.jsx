import React from 'react';

export default function FormTemplate({
  title,
  subtitle,
  icon,
  onSubmit,
  onCancel,
  isEditing = false,
  children,
  submitText = "Simpan",
  cancelText = "Batal",
  submitIcon = "save",
  cancelIcon = "close",
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon && (
          <span className="material-icons-round text-primary" style="">
            {icon}
          </span>
        )}
        <h2 className="text-lg font-bold text-slate-800" style="">
          {title}
        </h2>
        {subtitle && (
          <span className="text-sm text-slate-500 ml-2">
            {subtitle}
          </span>
        )}
      </div>
      
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        {children}
        
        <div className="md:col-span-2 flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-lg transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <span className="material-icons-round text-lg">
                {cancelIcon}
              </span>
              {cancelText}
            </button>
          )}
          <button
            type="submit"
            className="flex-1 bg-primary hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <span className="material-icons-round text-lg">
              {submitIcon}
            </span>
            {submitText}
          </button>
        </div>
      </form>
    </div>
  );
}
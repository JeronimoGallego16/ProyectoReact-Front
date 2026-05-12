import { useEffect, useMemo, useState, type FormEvent } from 'react';
import SelectableFieldForm, { type SelectableFieldOption } from './SelectableFieldForm';

export type SelectableField = {
  name: string;
  label: string;
  options: SelectableFieldOption[];
  placeholder?: string;
  required?: boolean;
  value?: string | number;
};

type SelectableFieldsFormCardProps = {
  title: string;
  description?: string;
  fields: SelectableField[];
  saveLabel?: string;
  cancelLabel?: string;
  onSave?: (values: Record<string, string | number>) => void;
  onCancel?: () => void;
};

const SelectableFieldsFormCard = ({
  title,
  description,
  fields,
  saveLabel = 'Guardar cambios',
  cancelLabel = 'Cancelar',
  onSave,
  onCancel,
}: SelectableFieldsFormCardProps) => {
  // Inicializar valores basado en el array de fields
  const initialValues = useMemo(() => {
    return fields.reduce<Record<string, string | number>>((accumulator, field) => {
      accumulator[field.name] = field.value ?? '';
      return accumulator;
    }, {});
  }, [fields]);

  const [values, setValues] = useState<Record<string, string | number>>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (name: string, value: string | number) => {
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave?.(values);
  };

  const handleCancel = () => {
    setValues(initialValues);
    onCancel?.();
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
        <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-body dark:text-bodydark">{description}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5.5 p-6.5">
        {/* Renderiza dinámicamente todos los campos del array */}
        {fields.map((field) => (
          <div key={field.name}>
            <SelectableFieldForm
              label={field.label}
              options={field.options}
              value={values[field.name]}
              onChange={(value) => handleChange(field.name, value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        ))}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
          >
            {saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SelectableFieldsFormCard;

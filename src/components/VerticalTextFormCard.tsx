import { useEffect, useMemo, useState, type FormEvent } from 'react';

export type VerticalTextFormOption = {
  id?: string | number;
  label: string;
  value: string | number;
};

export type VerticalTextFormField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  kind?: 'input' | 'textarea' | 'select';
  rows?: number;
  value?: string;
  options?: VerticalTextFormOption[];
  required?: boolean;
};

type VerticalTextFormCardProps = {
  title: string;
  description?: string;
  fields: VerticalTextFormField[];
  saveLabel?: string;
  cancelLabel?: string;
  onSave?: (values: Record<string, string>) => void;
  onCancel?: () => void;
};

const VerticalTextFormCard = ({
  title,
  description,
  fields,
  saveLabel = 'Guardar cambios',
  cancelLabel = 'Cancelar',
  onSave,
  onCancel,
}: VerticalTextFormCardProps) => {
  const initialValues = useMemo(() => {
    return fields.reduce<Record<string, string>>((accumulator, field) => {
      accumulator[field.name] = field.value ?? '';
      return accumulator;
    }, {});
  }, [fields]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (name: string, value: string) => {
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
        {fields.map((field) => (
          <div key={field.name}>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              {field.label}
            </label>
            {field.kind === 'textarea' ? (
              <textarea
                rows={field.rows ?? 5}
                value={values[field.name] ?? ''}
                placeholder={field.placeholder ?? field.label}
                required={field.required}
                onChange={(event) => handleChange(field.name, event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            ) : field.kind === 'select' ? (
              <select
                value={values[field.name] ?? ''}
                required={field.required}
                onChange={(event) => handleChange(field.name, event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                <option value="">{field.placeholder ?? field.label}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? 'text'}
                value={values[field.name] ?? ''}
                placeholder={field.placeholder ?? field.label}
                required={field.required}
                onChange={(event) => handleChange(field.name, event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            )}
          </div>
        ))}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-stroke px-5 py-2.5 text-sm font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
          >
            {saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerticalTextFormCard;
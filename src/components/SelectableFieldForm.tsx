import { useEffect, useRef, useState } from 'react';

export type SelectableFieldOption = {
  id: string | number;
  label: string;
  value: string | number;
};

type SelectableFieldFormProps = {
  label: string;
  options: SelectableFieldOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

const SelectableFieldForm = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled = false,
  required = false,
}: SelectableFieldFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectableFieldOption | undefined>();
  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);

  // Encontrar la opción seleccionada
  useEffect(() => {
    const selected = options.find((opt) => opt.value === value);
    setSelectedOption(selected);
  }, [value, options]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current || !trigger.current) return;
      if (
        !isOpen ||
        dropdown.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('click', clickHandler);
      return () => document.removeEventListener('click', clickHandler);
    }
  }, [isOpen]);

  // Cerrar al presionar ESC
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!isOpen || keyCode !== 27) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', keyHandler);
      return () => document.removeEventListener('keydown', keyHandler);
    }
  }, [isOpen]);

  const handleSelect = (option: SelectableFieldOption) => {
    setSelectedOption(option);
    onChange?.(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <label className="mb-2.5 block font-medium text-black dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <button
        ref={trigger}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        type="button"
        className={`relative w-full rounded-lg border bg-transparent py-3 px-5 font-medium text-black outline-none transition dark:text-white ${
          disabled
            ? 'cursor-not-allowed border-stroke opacity-50 dark:border-strokedark'
            : 'border-stroke hover:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
        } flex items-center justify-between`}
      >
        <span className={selectedOption ? 'text-black dark:text-white' : 'text-bodydark'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown de opciones */}
      <div
        ref={dropdown}
        className={`absolute left-0 right-0 top-full z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        {options.length > 0 ? (
          options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={`flex w-full items-center px-5 py-3 text-left transition hover:bg-gray dark:hover:bg-meta-4 ${
                selectedOption?.id === option.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/10'
                  : 'text-black dark:text-white'
              }`}
            >
              <span className="mr-3">
                {selectedOption?.id === option.id && (
                  <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              {option.label}
            </button>
          ))
        ) : (
          <div className="px-5 py-3 text-center text-bodydark">No hay opciones disponibles</div>
        )}
      </div>
    </div>
  );
};

export default SelectableFieldForm;

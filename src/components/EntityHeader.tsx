import React, { ReactNode } from 'react';

type EntityHeaderProps = {
  /** Función para volver a la página anterior */
  onBack: () => void;
  /** Texto del botón volver (ej: "← Volver a Rúbricas") */
  backLabel: string;
  /** Título principal de la entidad */
  title: string;
  /** Descripción de la entidad (opcional) */
  description?: string;
  /** Etiqueta del tipo de entidad (ej: "Rúbrica", "Criterio") - aparece en uppercase */
  entityType?: string;
  /** Contenido adicional (ej: peso, otros campos) */
  children?: ReactNode;
};

/**
 * Header reutilizable para mostrar información de una entidad
 * Incluye botón de volver atrás y caja con info de la entidad
 */
export default function EntityHeader({
  onBack,
  backLabel,
  title,
  description,
  entityType,
  children,
}: EntityHeaderProps) {
  return (
    <>
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-md bg-meta-9 px-4 py-2 text-sm font-medium text-body hover:bg-opacity-90 dark:text-bodydark"
      >
        {backLabel}
      </button>

      {/* Entity info card */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-6 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        {entityType && (
          <p className="text-xs font-medium uppercase text-body dark:text-bodydark">{entityType}</p>
        )}
        <h2 className={`text-title-md2 font-semibold text-black dark:text-white ${entityType ? 'mt-1' : ''}`}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-body dark:text-bodydark">{description}</p>
        )}
        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>
    </>
  );
}

import { useState } from 'react';

type CrudMode = 'create' | 'edit' | null;

/**
 * Hook genérico para gestionar el estado de un modal CRUD
 * Centraliza la lógica de abrir, cerrar, editar y crear elementos
 */
export function useCrudModal<T extends { id?: string }>(emptyForm: Omit<T, 'id'>) {
  const [crudMode, setCrudMode] = useState<CrudMode>(null);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [form, setForm] = useState<Omit<T, 'id'>>(emptyForm);

  const resetCrud = () => {
    setCrudMode(null);
    setSelectedItem(null);
    setForm(emptyForm);
  };

  const startCreate = () => {
    setSelectedItem(null);
    setForm(emptyForm);
    setCrudMode('create');
  };

  const startEdit = (item: T) => {
    setSelectedItem(item);
    const { id, ...itemWithoutId } = item;
    setForm(itemWithoutId as Omit<T, 'id'>);
    setCrudMode('edit');
  };

  const closeCrud = resetCrud;
  const openCreate = startCreate;
  const openEdit = startEdit;

  return {
    crudMode,
    selectedItem,
    form,
    setForm,
    resetCrud,
    startCreate,
    startEdit,
    closeCrud,
    openCreate,
    openEdit,
  };
}

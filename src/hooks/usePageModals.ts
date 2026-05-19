import { useState } from 'react';

export function usePageModals() {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return {
    isDetailOpen,
    setIsDetailOpen,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    isStatusOpen,
    setIsStatusOpen,
    selectedItem,
    setSelectedItem,
    closeAll: () => {
      setIsDetailOpen(false);
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setIsStatusOpen(false);
      setSelectedItem(null);
    },
  };
}
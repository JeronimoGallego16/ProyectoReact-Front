import Swal from 'sweetalert2';

type Opts = { title?: string, confirmText?: string, cancelText?: string };

export function useSwalConfirm() {
  const confirmBtnClass = 'rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90';
  const cancelBtnClass = 'rounded border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2';

  const showConfirm = async (message: string, opts?: Opts) => {
    const result = await Swal.fire({
      title: opts?.title ?? 'Confirmar',
      html: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: opts?.confirmText ?? 'Confirmar',
      cancelButtonText: opts?.cancelText ?? 'Cancelar',
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        confirmButton: confirmBtnClass,
        cancelButton: cancelBtnClass,
      },
    });
    return !!result.isConfirmed;
  };

  const showAlert = async (message: string, opts?: Opts & { icon?: 'info' | 'error' | 'success' }) => {
    await Swal.fire({
      title: opts?.title ?? '',
      html: message,
      icon: opts?.icon ?? 'info',
      confirmButtonText: opts?.confirmText ?? 'Entendido',
      buttonsStyling: false,
      customClass: {
        confirmButton: confirmBtnClass,
      },
    });
  };

  return { showConfirm, showAlert } as const;
}

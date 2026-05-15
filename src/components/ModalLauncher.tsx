import { ReactNode, useState } from 'react';

type ModalLauncherProps = {
  trigger: (open: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
};

// Reusable launcher: trigger receives `open`, children receives `close`
export default function ModalLauncher({ trigger, children, className }: ModalLauncherProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <div onClick={() => setOpen(true)}>{trigger(() => setOpen(true))}</div>
      {open ? (
        <>{children(() => setOpen(false))}</>
      ) : null}
    </div>
  );
}

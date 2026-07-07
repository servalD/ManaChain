'use client'

import { toast as sonnerToast } from 'sonner';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function toast({ title, description, variant = 'default', duration = 4000 }: ToastOptions) {
  const message = description ? `${title}: ${description}` : title;

  switch (variant) {
    case 'success':
      return sonnerToast.success(title, {
        description,
        duration,
      });
    case 'error':
      return sonnerToast.error(title, {
        description,
        duration,
      });
    case 'warning':
      return sonnerToast.warning(title, {
        description,
        duration,
      });
    default:
      return sonnerToast(title, {
        description,
        duration,
      });
  }
}

interface ConfirmToastOptions {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function confirmToast({ 
  title, 
  description, 
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ConfirmToastOptions) {
  return sonnerToast.warning(title, {
    description,
    duration: Infinity, // Le toast reste jusqu'à action de l'utilisateur
    action: {
      label: confirmText,
      onClick: () => {
        onConfirm();
      },
    },
    cancel: {
      label: cancelText,
      onClick: () => {
        if (onCancel) onCancel();
      },
    },
  });
}

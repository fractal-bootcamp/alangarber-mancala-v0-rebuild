"use client"

import type React from "react"

// Inspired by react-hot-toast library
import { useState, useEffect, useCallback } from "react"

export type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToasterToast = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toasts: ToasterToast[] = []

type UseToastType = {
  toast: ({ title, description, variant, action }: Omit<ToasterToast, "id">) => string
  dismiss: (toastId?: string) => void
  toasts: ToasterToast[]
}

export const useToast = (): UseToastType => {
  const [, setToasts] = useState<ToasterToast[]>(toasts)

  useEffect(() => {
    setToasts([...toasts])

    return () => {
      toasts.splice(0, toasts.length)
    }
  }, [])

  const toast = useCallback(
    ({ ...props }: Omit<ToasterToast, "id">) => {
      const id = genId()

      const newToast = {
        ...props,
        id,
      }

      toasts.push(newToast)
      setToasts([...toasts])

      return id
    },
    [setToasts],
  )

  const dismiss = useCallback(
    (toastId?: string) => {
      if (toastId) {
        const index = toasts.findIndex((toast) => toast.id === toastId)
        if (index !== -1) {
          toasts.splice(index, 1)
          setToasts([...toasts])
        }
      } else {
        toasts.splice(0, toasts.length)
        setToasts([])
      }
    },
    [setToasts],
  )

  return {
    toast,
    dismiss,
    toasts,
  }
}

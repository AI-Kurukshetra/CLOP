import { Loader2 } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'

export function LoadingButton({
  loading,
  children,
  ...props
}: ButtonProps & {
  loading?: boolean
}) {
  return (
    <Button disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  )
}

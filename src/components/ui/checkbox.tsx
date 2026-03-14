import { cn } from '@/lib/utils/cn'

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border border-[#E8ECF0] text-[#4F7EF7] focus:ring-[#4F7EF7]',
        className,
      )}
      {...props}
    />
  )
}

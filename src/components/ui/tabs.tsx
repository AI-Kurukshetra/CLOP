'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils/cn'

export const Tabs = TabsPrimitive.Root

export function TabsList({
  className,
  ...props
}: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn('inline-flex rounded-md bg-[#F8FAFC] p-1', className)} {...props} />
}

export function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'rounded-md px-4 py-2 text-sm font-medium text-[#718096] transition data-[state=active]:bg-white data-[state=active]:text-[#1A202C] data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export const TabsContent = TabsPrimitive.Content

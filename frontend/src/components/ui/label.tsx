'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'

function Label({ ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      {...props}
    />
  )
}

export { Label }

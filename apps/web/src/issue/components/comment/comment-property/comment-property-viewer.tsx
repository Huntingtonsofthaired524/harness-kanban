import React, { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/shadcn/utils'
import { PropertyOptionItem } from '@/property/types/property-types'
import { CommentPropertyRegistryEntry, CommentPropertyType, CommentPropertyValueType } from './types'

interface CommentPropertyViewerProps {
  property: CommentPropertyRegistryEntry
  value: CommentPropertyValueType
  className?: string
}

export const CommentPropertyViewer: React.FC<CommentPropertyViewerProps> = ({ property, value, className }) => {
  const [options, setOptions] = useState<PropertyOptionItem[]>([])

  const renderValue = () => {
    if (!value) return null

    // TODO: consider handle more types using registry mode
    switch (property.type) {
      case CommentPropertyType.SELECT: {
        const option = options.find(opt => String(opt.value) === String(value))
        return option ? option.label : String(value)
      }

      case CommentPropertyType.BOOLEAN:
        return value ? 'Yes' : 'No'

      default:
        return String(value)
    }
  }

  useEffect(() => {
    if (property.optionsLoader && property.type === CommentPropertyType.SELECT) {
      Promise.resolve(property.optionsLoader())
        .then(setOptions)
        .catch(() => setOptions([]))
    }
  }, [property])

  const CustomViewer = property.readonly
  if (CustomViewer) {
    return <CustomViewer value={renderValue()} meta={property.meta} options={options} className={className} />
  }

  return (
    <Badge variant="secondary" className={cn('font-normal', className)}>
      {renderValue()}
    </Badge>
  )
}

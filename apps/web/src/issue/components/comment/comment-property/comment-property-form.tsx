import React, { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/shadcn/utils'
import { PropertyOptionItem } from '@/property/types/property-types'
import { CommentPropertyRegistryEntry, CommentPropertyType, CommentPropertyValueType } from './types'

interface CommentPropertyFormProps {
  property: CommentPropertyRegistryEntry
  value: CommentPropertyValueType
  onChange: (value: CommentPropertyValueType) => void
  disabled?: boolean
  hasError?: boolean
}

export const CommentPropertyForm: React.FC<CommentPropertyFormProps> = ({
  property,
  value,
  onChange,
  disabled = false,
  hasError = false,
}) => {
  const [options, setOptions] = useState<PropertyOptionItem[]>([])
  const [loading, setLoading] = useState(false)

  const renderField = () => {
    switch (property.type) {
      case CommentPropertyType.STRING:
        return (
          <Input
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={property.meta.display?.placeholder}
            disabled={disabled}
            className={cn(hasError && 'border-red-500')}
          />
        )

      case CommentPropertyType.NUMBER:
        return (
          <Input
            type="number"
            value={(value as number) || ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={property.meta.display?.placeholder}
            disabled={disabled}
            min={property.meta.validation?.min}
            max={property.meta.validation?.max}
            className={cn(hasError && 'border-red-500')}
          />
        )

      case CommentPropertyType.SELECT:
        return (
          <Select value={(value as string) || ''} onValueChange={onChange} disabled={disabled || loading}>
            <SelectTrigger className={cn('w-full', hasError && 'border-red-500')}>
              <SelectValue
                placeholder={loading ? 'Loading...' : property.meta.display?.placeholder || 'Select an option'}
              />
            </SelectTrigger>
            <SelectContent className="w-full">
              {options.map(option => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case CommentPropertyType.BOOLEAN:
        return (
          <input
            type="checkbox"
            checked={(value as boolean) || false}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300"
          />
        )

      default:
        return null
    }
  }

  const CustomRenderer = property.editable

  useEffect(() => {
    if (property.optionsLoader && property.type === CommentPropertyType.SELECT) {
      setLoading(true)
      Promise.resolve(property.optionsLoader())
        .then(setOptions)
        .finally(() => setLoading(false))
    }
  }, [property])

  if (CustomRenderer) {
    return (
      <div className="space-y-2">
        <Label htmlFor={property.id}>
          {property.meta.display?.label || property.id}
          {property.meta.required && <span className="translate-y-0.5 text-red-500">*</span>}
        </Label>
        {property.meta.display?.description && (
          <p className="text-muted-foreground text-sm">{property.meta.display.description}</p>
        )}
        <CustomRenderer value={value} onChange={onChange} disabled={disabled} meta={property.meta} options={options} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={property.id}>
        {property.meta.display?.label || property.id}
        {property.meta.required && <span className="translate-y-0.5 text-red-500">*</span>}
      </Label>
      {property.meta.display?.description && (
        <p className="text-muted-foreground text-sm">{property.meta.display.description}</p>
      )}
      {renderField()}
      {hasError && property.meta.required && <p className="mt-1 text-xs text-red-500">This field is required</p>}
    </div>
  )
}

import React from 'react'

import { PropertyOptionItem } from '@/property/types/property-types'

export interface SelectorConfig {
  options: (PropertyOptionItem & { icon?: React.ReactNode })[]
}

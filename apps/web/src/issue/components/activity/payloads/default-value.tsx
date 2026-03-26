import { ActivityRendererComponent } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared/issue/constants'
import { ClearPropertyValueActivityPayload, SetPropertyValueActivityPayload } from '@repo/shared/issue/types'

export const DefaultPropertyValue: ActivityRendererComponent = ({ activity }) => {
  if (activity.type === ActivityType.SET_PROPERTY_VALUE) {
    const p = activity.payload as SetPropertyValueActivityPayload
    return <span className="text-foreground">{String(p.newValue ?? '-')}</span>
  }

  if (activity.type === ActivityType.CLEAR_PROPERTY_VALUE) {
    const p = activity.payload as ClearPropertyValueActivityPayload
    return <span className="text-muted-foreground italic">{p.propertyName} cleared</span>
  }

  return <span className="text-muted-foreground italic">Unsupported</span>
}

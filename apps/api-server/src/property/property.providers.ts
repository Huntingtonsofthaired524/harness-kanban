import { PropertyType } from '@repo/shared/property/constants'
import { REGISTRY_NAMES } from './constants/registry.constants'
import {
  DatetimePropertyProcessor,
  NumberPropertyProcessor,
  ProjectPropertyProcessor,
  RichTextPropertyProcessor,
  SelectPropertyProcessor,
  StatusPropertyProcessor,
  TitlePropertyProcessor,
  UserPropertyProcessor,
} from './create-property-processors'
import {
  DatetimeUpdatePropertyProcessor,
  NumberUpdatePropertyProcessor,
  ProjectUpdatePropertyProcessor,
  RichTextUpdatePropertyProcessor,
  SelectUpdatePropertyProcessor,
  StatusUpdatePropertyProcessor,
  TitleUpdatePropertyProcessor,
  UserUpdatePropertyProcessor,
} from './update-property-processors'

export const propertyImplProviders = () => {
  const providers = [
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.TITLE}`,
      useClass: TitlePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.STATUS}`,
      useClass: StatusPropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.SELECT}`,
      useClass: SelectPropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.NUMBER}`,
      useClass: NumberPropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.DATETIME}`,
      useClass: DatetimePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.USER}`,
      useClass: UserPropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.PROJECT}`,
      useClass: ProjectPropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.CREATION_PROPERTY_PROCESSOR}-${PropertyType.RICH_TEXT}`,
      useClass: RichTextPropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.TITLE}`,
      useClass: TitleUpdatePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.STATUS}`,
      useClass: StatusUpdatePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.SELECT}`,
      useClass: SelectUpdatePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.NUMBER}`,
      useClass: NumberUpdatePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.DATETIME}`,
      useClass: DatetimeUpdatePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.USER}`,
      useClass: UserUpdatePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.PROJECT}`,
      useClass: ProjectUpdatePropertyProcessor,
    },
    {
      provide: `${REGISTRY_NAMES.PROPERTY_UPDATE_PROCESSOR}-${PropertyType.RICH_TEXT}`,
      useClass: RichTextUpdatePropertyProcessor,
    },
  ]

  return providers
}

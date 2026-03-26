import { IssueRowType } from '@/issue/types/issue-types'
import { PropertyValueType } from '@/property/types/property-types'
import { Issue } from '@repo/shared/property/types'

export const convertIssueToRow = (issue: Issue): IssueRowType => {
  const row: IssueRowType = {
    id: issue.issueId,
  }

  for (const pv of issue.propertyValues) {
    row[pv.propertyId] = pv.value as PropertyValueType
  }

  return row
}

import { Application, Context } from 'probot'
import { GetAllResponseItem } from '@octokit/rest'
import * as R from 'ramda'

const BASE_BRANCH = 'master'

export async function getAllMergedPullRequests(
  app: Application,
  context: Context,
  since?: Date
) {
  let pullRequests: GetAllResponseItem[] = await context.github.paginate(
    context.github.pullRequests.getAll({
      base: BASE_BRANCH,
      sort: 'updated',
      state: 'closed',
      direction: 'asc',
      ...context.repo()
    }),
    res => res.data
  )

  pullRequests = R.reverse(pullRequests)

  if (!since) return pullRequests

  const mergedPullRequestsSinceLastRelease = pullRequests.filter(
    x => (!!x.merged_at ? new Date(x.merged_at) > since : false)
  )

  return mergedPullRequestsSinceLastRelease
}

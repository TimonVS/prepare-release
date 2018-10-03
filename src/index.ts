import { Application, Context } from 'probot'
import { findReleases } from './releases'
import { GetAllResponseItem, GetReleaseResponse } from '@octokit/rest'

const BASE_BRANCH = 'master'

export = (app: Application) => {
  app.on('pull_request.closed', async context => {
    if (!context.payload.pull_request.merged_at) return

    const { draftRelease, lastRelease } = await findReleases(app, context)
    const mergedPullRequestsSinceLastRelease = await getAllMergedPullRequestsSinceLastRelease(
      app,
      context,
      lastRelease
    )
    const releaseBody = generateReleaseBody(mergedPullRequestsSinceLastRelease)

    // Don't create a new draft release when there are no PRs for the changelog
    if (mergedPullRequestsSinceLastRelease.length === 0 && !draftRelease) return

    if (draftRelease) {
      await context.github.repos.editRelease({
        release_id: draftRelease.id,
        body: releaseBody,
        draft: true,
        ...context.repo()
      })
    } else {
      await context.github.repos.createRelease({
        tag_name: '',
        body: releaseBody,
        draft: true,
        ...context.repo()
      })
    }
  })
}

async function getAllMergedPullRequestsSinceLastRelease(
  app: Application,
  context: Context,
  lastRelease: GetReleaseResponse
) {
  const pullRequests: GetAllResponseItem[] = await context.github.paginate(
    context.github.pullRequests.getAll({
      base: BASE_BRANCH,
      sort: 'updated',
      state: 'closed',
      direction: 'desc',
      ...context.repo()
    }),
    res => res.data
  )

  if (!lastRelease) return pullRequests

  const mergedPullRequestsSinceLastRelease = pullRequests.filter(
    x =>
      !!x.merged_at
        ? new Date(x.merged_at) > new Date(lastRelease.published_at)
        : false
  )

  return mergedPullRequestsSinceLastRelease
}

function generateReleaseBody(pullRequests: GetAllResponseItem[]) {
  return (
    '# Changelog\n\n' +
    pullRequests
      .map(x => `* ${x.title} [#${x.number}](${x.html_url})`)
      .join('\n')
  )
}

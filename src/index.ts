import { Application, Context } from 'probot'
import { findReleases } from './releases'
import { GetAllResponseItem, GetReleasesResponseItem } from '@octokit/rest'

const BASE_BRANCH = 'master'

export = (app: Application) => {
  app.on('pull_request.closed', async context => {
    if (!context.payload.pull_request.merged_at) return

    const { draftRelease, lastRelease } = await findReleases(app, context)
    const pullRequeasts = await getPullRequestsSinceLastRelease(
      app,
      context,
      lastRelease
    )

    const releaseBody = generateReleaseBody(pullRequeasts)

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

async function getPullRequestsSinceLastRelease(
  app: Application,
  context: Context,
  lastRelease?: GetReleasesResponseItem
) {
  const pullRequests = await context.github.paginate(
    context.github.pullRequests.getAll({
      base: BASE_BRANCH,
      state: 'closed',
      direction: 'desc',
      ...context.repo()
    }),
    res => res.data
  )

  return lastRelease && lastRelease.published_at
    ? pullRequests.filter(
        x =>
          !!x.merged_at
            ? new Date(x.merged_at) > new Date(lastRelease.published_at)
            : false
      )
    : pullRequests
}

function generateReleaseBody(pullRequests: GetAllResponseItem[]) {
  return (
    '# Changelog\n\n' +
    pullRequests
      .map(x => `* ${x.title} [#${x.number}](${x.html_url})`)
      .join('\n')
  )
}

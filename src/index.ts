import { Application } from 'probot'
import { findReleases } from './releases'
import { GetAllResponseItem } from '@octokit/rest'
import { getAllMergedPullRequests } from './pull-requests'

export = (app: Application) => {
  app.on('pull_request.closed', async context => {
    if (!context.payload.pull_request.merged_at) return

    const { draftRelease, lastRelease } = await findReleases(app, context)
    const mergedPullRequestsSinceLastRelease = await getAllMergedPullRequests(
      app,
      context,
      lastRelease ? new Date(lastRelease.published_at) : undefined
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

function generateReleaseBody(pullRequests: GetAllResponseItem[]) {
  return (
    '# Changelog\n\n' +
    pullRequests
      .map(x => `* ${x.title} [#${x.number}](${x.html_url})`)
      .join('\n')
  )
}

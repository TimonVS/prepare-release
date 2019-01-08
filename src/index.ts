import { Application } from 'probot'
import getConfig from 'probot-config'
import { findReleases } from './releases'
import { GetAllResponseItem } from '@octokit/rest'
import { getAllMergedPullRequests } from './pull-requests'
import log from './log'

export = (app: Application) => {
  app.on('pull_request.closed', async context => {
    log(app, context, 'Merged PR')

    const config = await getConfig(context, 'prepare-release.yml', {
      template: '# Changes\n\n$CHANGES'
    })

    if (!context.payload.pull_request.merged_at) return

    const { draftRelease, lastRelease } = await findReleases(app, context)
    const mergedPullRequestsSinceLastRelease = await getAllMergedPullRequests(
      app,
      context,
      lastRelease ? new Date(lastRelease.published_at) : undefined
    )
    const releaseBody = generateReleaseBody(
      config.template,
      mergedPullRequestsSinceLastRelease
    )

    // Don't create a new draft release when there are no PRs for the changelog
    if (mergedPullRequestsSinceLastRelease.length === 0 && !draftRelease) return

    if (draftRelease) {
      log(app, context, 'Updating existing draft release')

      await context.github.repos.editRelease({
        release_id: draftRelease.id,
        body: releaseBody,
        draft: true,
        ...context.repo()
      })
    } else {
      log(app, context, 'Creating new draft release')

      await context.github.repos.createRelease({
        tag_name: '',
        body: releaseBody,
        draft: true,
        ...context.repo()
      })
    }
  })
}

function generateReleaseBody(
  template: string,
  pullRequests: GetAllResponseItem[]
) {
  return template.replace(
    '$CHANGES',
    pullRequests
      .map(
        pr =>
          `* ${pr.title} ([#${pr.number}](${pr.html_url})) @${pr.user!.login}`
      )
      .join('\n')
  )
}

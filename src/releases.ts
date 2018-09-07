import { Application, Context } from 'probot'
import * as R from 'ramda'
import { GetReleasesResponse } from '@octokit/rest'

const sortReleases = (releases: GetReleasesResponse) =>
  R.sort(
    (r1, r2) =>
      new Date(r1.published_at).getTime() - new Date(r2.published_at).getTime(),
    releases
  )

export async function findReleases(app: Application, context: Context) {
  const releases: GetReleasesResponse = await context.github.paginate(
    context.github.repos.getReleases(
      context.repo({
        per_page: 100
      })
    ),
    res => res.data
  )

  const sortedPublishedReleases = sortReleases(releases.filter(r => !r.draft))
  // TODO: check if the release was created by the bot
  const draftRelease = releases.find(r => r.draft)
  const lastRelease =
    sortedPublishedReleases[sortedPublishedReleases.length - 1]

  if (draftRelease) {
    app.log({
      app,
      context,
      message: `Draft release: ${draftRelease.tag_name}`
    })
  } else {
    app.log({ app, context, message: `No draft release found` })
  }

  if (lastRelease) {
    app.log({ app, context, message: `Last release: ${lastRelease.tag_name}` })
  } else {
    app.log({ app, context, message: `No last release found` })
  }

  return { draftRelease, lastRelease }
}

import { Application } from 'probot'
import myProbotApp from '../src'
import { paginate } from './helpers/mocks'
const pullRequestMergedPayload = require('./fixtures/webhooks/pull-request-merged.json')

describe('My Probot app', () => {
  let app: Application
  let github: any

  beforeEach(() => {
    app = new Application()
    app.load(myProbotApp)

    github = {
      repos: {
        createRelease: jest.fn().mockReturnValue(Promise.resolve({})),
        editRelease: jest.fn().mockReturnValue(Promise.resolve({})),
        getContent: jest
          .fn()
          .mockReturnValue(Promise.resolve({ data: { content: '' } }))
      },
      pullRequests: {},
      paginate
    }

    // Passes the mocked out GitHub API into out app instance
    app.auth = () => Promise.resolve(github)
  })

  test('create draft release', async () => {
    github.repos.getReleases = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ data: require('./fixtures/releases.json') })
      )

    github.pullRequests.getAll = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ data: require('./fixtures/pull-requests.json') })
      )

    await app.receive({
      name: 'pull_request.closed',
      payload: pullRequestMergedPayload
    })

    expect(github.repos.createRelease).toHaveBeenCalledWith({
      body: `# Changes\n\n* new-feature [#1347](https://github.com/octocat/Hello-World/pull/1347)`,
      draft: true,
      owner: 'TimonVS',
      repo: 'prepare-release-test-repo',
      tag_name: ''
    })
  })

  test('edit draft release if a draft release exists', async () => {
    github.repos.getReleases = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ data: require('./fixtures/releases-draft.json') })
      )

    github.pullRequests.getAll = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ data: require('./fixtures/pull-requests.json') })
      )

    await app.receive({
      name: 'pull_request.closed',
      payload: pullRequestMergedPayload
    })

    expect(github.repos.editRelease).toHaveBeenCalledWith({
      body: `# Changes\n\n* new-feature [#1347](https://github.com/octocat/Hello-World/pull/1347)`,
      draft: true,
      owner: 'TimonVS',
      repo: 'prepare-release-test-repo',
      release_id: 2
    })
  })

  test("don't create draft release when there are no merged PRs", async () => {
    github.repos.getReleases = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ data: require('./fixtures/releases.json') })
      )

    github.pullRequests.getAll = jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: [] }))

    await app.receive({
      name: 'pull_request.closed',
      payload: pullRequestMergedPayload
    })

    expect(github.repos.createRelease).not.toHaveBeenCalled()
  })
})

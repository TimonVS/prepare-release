import { Application } from 'probot'
import myProbotApp from '../src'
import pullRequestMergedPayload from './fixtures/pull_request_merged.json'

describe('My Probot app', () => {
  let app, github

  beforeEach(() => {
    app = new Application()
    // Initialize the app based on the code from index.js
    app.load(myProbotApp)
    // This is an easy way to mock out the GitHub API
    github = {
      issues: {
        createComment: jest.fn().mockReturnValue(Promise.resolve({}))
      }
    }
    // Passes the mocked out GitHub API into out app instance
    app.auth = () => Promise.resolve(github)
  })

  test('a', async () => {
    await app.receive({
      name: 'pull_request.closed',
      payload: pullRequestMergedPayload
    })
  })
})

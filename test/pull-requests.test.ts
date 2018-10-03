import { Application } from 'probot'
import { getAllMergedPullRequests } from '../src/pull-requests'
import { paginate } from './helpers/mocks'

function sortByDateAsc(a: Date, b: Date) {
  return a.getTime() - b.getTime()
}

test('returns all pull requests sorted by updated date', async () => {
  const context = {
    repo: jest.fn().mockReturnValue({}),
    github: {
      paginate,
      pullRequests: {
        getAll: jest.fn().mockReturnValue(
          Promise.resolve({
            data: require('./fixtures/pull-requests.json')
          })
        )
      }
    }
  } as any
  const pullRequests = await getAllMergedPullRequests(
    {} as Application,
    context
  )

  expect(pullRequests).toHaveLength(2)

  const mergedDates = pullRequests.map(x => new Date(x.merged_at!))

  expect(mergedDates).toEqual(mergedDates.slice().sort(sortByDateAsc))
})

test('filter pull requests before 2013-01-01', async () => {
  const context = {
    repo: jest.fn().mockReturnValue({}),
    github: {
      paginate,
      pullRequests: {
        getAll: jest.fn().mockReturnValue(
          Promise.resolve({
            data: require('./fixtures/pull-requests.json')
          })
        )
      }
    }
  } as any
  const pullRequests = await getAllMergedPullRequests(
    {} as Application,
    context,
    new Date('2013-01-01T00:00:00Z')
  )

  expect(pullRequests).toHaveLength(1)
})

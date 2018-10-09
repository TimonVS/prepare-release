import { AnyResponse } from '@octokit/rest'

export async function paginate(
  res: Promise<AnyResponse>,
  callback: (response: any, done?: () => void) => void
) {
  const done = () => {}
  return res.then(x => callback(x, done))
}

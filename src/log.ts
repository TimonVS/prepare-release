import { Application, Context } from 'probot'

const log = (app: Application, context: Context, message: string) => {
  const repo = context.payload.repository
  const prefix = repo ? `${repo.owner.login}/${repo.name}: ` : ''

  app.log(`${prefix}${message}`)
}

export default log

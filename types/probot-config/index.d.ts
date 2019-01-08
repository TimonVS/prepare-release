declare module 'probot-config' {
  import { Context } from 'probot'

  export default function getConfig<T>(
    context: Context,
    fileName: string,
    defaultConfig: T
  ): Promise<T & object>
}

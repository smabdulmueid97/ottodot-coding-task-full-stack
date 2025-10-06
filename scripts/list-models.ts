import { loadEnvConfig } from '@next/env'
import { GoogleGenerativeAI } from '@google/generative-ai'

type GoogleGenerativeAIWithListing = GoogleGenerativeAI & {
  listModels?: () => Promise<unknown>
}

async function listModels() {
  loadEnvConfig(process.cwd())

  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Missing GOOGLE_API_KEY')
  }

  const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) as GoogleGenerativeAIWithListing

  if (typeof client.listModels !== 'function') {
    console.warn('The installed @google/generative-ai SDK does not expose listModels().')
    console.warn('Please update the script or use the REST API to enumerate models.')
    return
  }

  const result = await client.listModels()
  console.log(result)
}

listModels().catch((error) => {
  console.error('Failed to list models', error)
  process.exitCode = 1
})

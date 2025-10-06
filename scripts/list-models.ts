import { loadEnvConfig } from '@next/env'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function listModels() {
  loadEnvConfig(process.cwd())

  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Missing GOOGLE_API_KEY')
  }

  const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  const result = await client.listModels()
  console.log(result)
}

listModels().catch((error) => {
  console.error('Failed to list models', error)
  process.exitCode = 1
})

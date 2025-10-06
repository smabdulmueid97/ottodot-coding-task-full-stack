import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_API_KEY

if (!apiKey) {
  throw new Error('Missing GOOGLE_API_KEY environment variable')
}

const client = new GoogleGenerativeAI(apiKey)

export const mathTutorModel = client.getGenerativeModel({ model: 'models/gemini-2.5-flash' }, { apiVersion: 'v1' })

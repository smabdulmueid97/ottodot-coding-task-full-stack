'use client'

import { FormEvent, useState } from 'react'

type ProblemResponse = {
  sessionId: string
  problem: {
    problem_text: string
  }
}

type SubmitResponse = {
  isCorrect: boolean
  feedback: string
  correctAnswer: number
}

type ApiErrorPayload = {
  message?: string
}

function getApiErrorMessage(payload: unknown, fallbackMessage: string) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const { message } = payload as ApiErrorPayload
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return fallbackMessage
}

function isProblemResponse(value: unknown): value is ProblemResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ProblemResponse>
  return (
    typeof candidate.sessionId === 'string' &&
    !!candidate.problem &&
    typeof candidate.problem === 'object' &&
    typeof candidate.problem.problem_text === 'string'
  )
}

function isSubmitResponse(value: unknown): value is SubmitResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<SubmitResponse>
  return (
    typeof candidate.isCorrect === 'boolean' &&
    typeof candidate.feedback === 'string' &&
    typeof candidate.correctAnswer === 'number'
  )
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [problemText, setProblemText] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateProblem = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setFeedback('')
      setIsCorrect(null)
      setCorrectAnswer(null)
      setUserAnswer('')

      const response = await fetch('/api/math-problem', {
        method: 'POST',
      })

      const payload = (await response.json()) as unknown

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, 'Failed to generate a new problem.'))
      }

      if (!isProblemResponse(payload)) {
        throw new Error('Received an unexpected response from the server.')
      }

      setSessionId(payload.sessionId)
      setProblemText(payload.problem.problem_text)
    } catch (err) {
      console.error('Problem generation failed', err)
      setError(
        err instanceof Error
          ? err.message
          : 'We could not generate a new problem right now. Please try again.'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!sessionId) {
      setError('Please generate a problem before submitting an answer.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/math-problem/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userAnswer: Number(userAnswer),
        }),
      })

      const payload = (await response.json()) as unknown

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, 'Failed to submit your answer.'))
      }

      if (!isSubmitResponse(payload)) {
        throw new Error('Received an unexpected response from the server.')
      }

      setFeedback(payload.feedback)
      setIsCorrect(payload.isCorrect)
      setCorrectAnswer(payload.correctAnswer ?? null)
    } catch (err) {
      console.error('Answer submission failed', err)
      setError(
        err instanceof Error
          ? err.message
          : 'We could not check your answer right now. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Math Problem Generator
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 transition-transform">
          <button
            onClick={generateProblem}
            disabled={isGenerating || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 ease-in-out transform hover:scale-[1.01]"
          >
            {isGenerating ? 'Generating...' : 'Generate New Problem'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {problemText && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Problem</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">{problemText}</p>

            <form onSubmit={submitAnswer} className="space-y-5">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-600 mb-2">
                  Your Answer
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userAnswer || isSubmitting || isGenerating}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 ease-in-out transform hover:scale-[1.01]"
              >
                {isSubmitting ? 'Checking...' : 'Submit Answer'}
              </button>
            </form>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-2xl shadow-lg p-6 mb-6 border-2 ${
              isCorrect ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
            }`}
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              {isCorrect ? 'Nice work! That is correct.' : 'Let us try that again.'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">{feedback}</p>
            {correctAnswer !== null && !isCorrect && (
              <p className="text-sm text-gray-600">Correct Answer: {correctAnswer}</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

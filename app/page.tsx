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
    <div className="relative min-h-screen bg-cyber-vault bg-cover bg-center bg-fixed">
      <div className="min-h-screen bg-slate-950/85 backdrop-blur-sm">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
          <header className="space-y-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200/80">
              Smart Practice Portal
            </p>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Math Problem Generator</h1>
            <p className="mx-auto max-w-xl text-base text-slate-200 sm:text-lg">
              Generate adaptive Primary 5 math questions and receive instant feedback on every answer.
            </p>
          </header>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <button
              onClick={generateProblem}
              disabled={isGenerating || isSubmitting}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-500/90 px-5 py-3 text-base font-semibold text-white shadow-xl shadow-indigo-900/40 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 disabled:cursor-not-allowed disabled:bg-indigo-900/40 disabled:text-indigo-100/60"
            >
              <span>{isGenerating ? 'Generating a new challenge...' : 'Generate A New Problem'}</span>
            </button>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-400/40 bg-red-500/10 px-5 py-4 text-sm text-red-100 shadow-xl shadow-red-950/30 backdrop-blur">
              {error}
            </div>
          )}

          {problemText && (
            <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Problem</h2>
                <p className="text-base leading-relaxed text-indigo-100">{problemText}</p>
              </div>

              <form onSubmit={submitAnswer} className="space-y-5">
                <div className="grid gap-2">
                  <label
                    htmlFor="answer"
                    className="text-sm font-medium uppercase tracking-wide text-indigo-200/80"
                  >
                    Your Answer
                  </label>
                  <input
                    type="number"
                    id="answer"
                    value={userAnswer}
                    onChange={(event) => setUserAnswer(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-3 text-lg text-white placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="Enter your best attempt"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!userAnswer || isSubmitting || isGenerating}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-5 py-3 text-base font-semibold text-white shadow-xl shadow-emerald-900/40 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-900/40 disabled:text-emerald-100/60"
                >
                  <span>{isSubmitting ? 'Checking your work...' : 'Submit Answer'}</span>
                </button>
              </form>
            </section>
          )}

          {feedback && (
            <section
              className={`rounded-3xl border px-8 py-6 text-base shadow-2xl shadow-black/30 backdrop-blur ${
                isCorrect
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : 'border-amber-400/40 bg-amber-500/10 text-amber-100'
              }`}
            >
              <h2 className="text-2xl font-semibold">
                {isCorrect ? 'Nice work! That is correct.' : 'Let us try that again.'}
              </h2>
              <p className="mt-2 leading-relaxed">{feedback}</p>
              {correctAnswer !== null && !isCorrect && (
                <p className="mt-4 text-sm font-medium">
                  Correct Answer: <span className="font-semibold">{correctAnswer}</span>
                </p>
              )}
            </section>
          )}

          <footer className="mt-auto text-center text-xs font-semibold uppercase tracking-[0.35em] text-slate-400/60">
            Practice. Reflect. Improve.
          </footer>
        </main>
      </div>
    </div>
  )
}

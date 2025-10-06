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
    <div className="page">
      <div className="page__overlay">
        <main className="page__main">
          <header className="page__header">
            <p className="page__eyebrow">Smart Practice Portal</p>
            <h1 className="page__title">Math Problem Generator</h1>
            <p className="page__subtitle">
              Generate adaptive Primary 5 math questions and receive instant feedback on every answer.
            </p>
          </header>

          <div className="card card--action">
            <button
              onClick={generateProblem}
              disabled={isGenerating || isSubmitting}
              className="button button--primary"
            >
              <span>{isGenerating ? 'Generating a new challenge...' : 'Generate A New Problem'}</span>
            </button>
          </div>

          {error && <div className="alert alert--error">{error}</div>}

          {problemText && (
            <section className="card card--problem">
              <div className="problem__header">
                <h2 className="problem__title">Problem</h2>
                <p className="problem__text">{problemText}</p>
              </div>

              <form onSubmit={submitAnswer} className="answer-form">
                <div className="answer-form__field">
                  <label htmlFor="answer" className="answer-form__label">
                    Your Answer
                  </label>
                  <input
                    type="number"
                    id="answer"
                    value={userAnswer}
                    onChange={(event) => setUserAnswer(event.target.value)}
                    className="answer-form__input"
                    placeholder="Enter your best attempt"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!userAnswer || isSubmitting || isGenerating}
                  className="button button--secondary"
                >
                  <span>{isSubmitting ? 'Checking your work...' : 'Submit Answer'}</span>
                </button>
              </form>
            </section>
          )}

          {feedback && (
            <section
              className={`card card--feedback ${
                isCorrect ? 'card--feedback-success' : 'card--feedback-warning'
              }`}
            >
              <h2 className="feedback__title">
                {isCorrect ? 'Nice work! That is correct.' : 'Let us try that again.'}
              </h2>
              <p className="feedback__message">{feedback}</p>
              {correctAnswer !== null && !isCorrect && (
                <p className="feedback__hint">
                  Correct Answer: <span className="feedback__answer-value">{correctAnswer}</span>
                </p>
              )}
            </section>
          )}

          <footer className="page__footer">Practice. Reflect. Improve.</footer>
        </main>
      </div>
    </div>
  )
}

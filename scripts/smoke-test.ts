import { loadEnvConfig } from '@next/env'

async function run() {
  loadEnvConfig(process.cwd())

  const { POST: generateProblem } = await import('../app/api/math-problem/route')
  const { POST: submitAnswer } = await import('../app/api/math-problem/submit/route')
  const { supabase } = await import('../lib/supabaseClient')
  const supabaseClient = supabase as any

  const generateResponse = await generateProblem()
  const generatedData = (await generateResponse.json()) as {
    sessionId: string
    problem: { problem_text: string }
  }

  console.log('Generated problem:', generatedData.problem.problem_text)

  const sessionFetch = await supabaseClient
    .from('math_problem_sessions')
    .select('final_answer')
    .eq('id', generatedData.sessionId)
    .single()

  if (sessionFetch.error || !sessionFetch.data) {
    throw sessionFetch.error ?? new Error('Session lookup failed')
  }

  const { final_answer } = sessionFetch.data as { final_answer: number }

  const submitRequest = new Request('http://localhost/api/math-problem/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: generatedData.sessionId,
      userAnswer: Number(final_answer),
    }),
  })

  const submitResponse = await submitAnswer(submitRequest)
  const submissionData = (await submitResponse.json()) as {
    isCorrect: boolean
    feedback: string
    correctAnswer: number
  }

  console.log('Submission result:', submissionData)
}

run().catch((error) => {
  console.error('Smoke test failed', error)
  process.exitCode = 1
})

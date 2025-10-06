import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { mathTutorModel } from '@/lib/gemini'
import type { Database } from '@/lib/supabaseClient'

type SubmitRequestBody = {
  sessionId?: string
  userAnswer?: number | string
}

function buildFeedbackPrompt(problemText: string, finalAnswer: number, userAnswer: number, isCorrect: boolean) {
  const correctness = isCorrect ? 'correct' : 'incorrect'
  return `You are a warm, encouraging Primary 5 math tutor.
Problem: ${problemText}
Correct answer: ${finalAnswer}
Student answer: ${userAnswer} (this is ${correctness}).
Provide feedback in 2 short sentences max.
If the student is incorrect, explain the key mistake and hint at the right approach without giving a full solution.
If the student is correct, celebrate briefly and reinforce the math concept.
Respond with plain text only.`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitRequestBody
    const sessionId = body.sessionId?.toString().trim()
    const userAnswerNumber = Number(body.userAnswer)

    if (!sessionId) {
      return NextResponse.json({ message: 'Missing sessionId' }, { status: 400 })
    }

    if (!Number.isFinite(userAnswerNumber)) {
      return NextResponse.json({ message: 'User answer must be a number' }, { status: 400 })
    }

    const sessionResult = await supabase
      .from('math_problem_sessions')
      .select('id, problem_text, final_answer')
      .eq('id', sessionId)
      .single()

    if (sessionResult.error || !sessionResult.data) {
      throw sessionResult.error ?? new Error('Session not found')
    }

    const { problem_text, final_answer } = sessionResult.data
    const correctAnswerNumber = Number(final_answer)
    const isCorrect = correctAnswerNumber === userAnswerNumber

    const feedbackPrompt = buildFeedbackPrompt(problem_text, correctAnswerNumber, userAnswerNumber, isCorrect)
    const feedbackResult = await mathTutorModel.generateContent(feedbackPrompt)
    const feedbackText = feedbackResult.response.text().trim()

    if (!feedbackText) {
      throw new Error('AI feedback generation failed')
    }

    const insertResult = await supabase
      .from('math_problem_submissions')
      .insert<Database['public']['Tables']['math_problem_submissions']['Insert'][]>([
        {
          session_id: sessionId,
          user_answer: userAnswerNumber,
          is_correct: isCorrect,
          feedback: feedbackText,
        },
      ])
      .select('id')
      .single()

    if (insertResult.error) {
      throw insertResult.error
    }

    return NextResponse.json({
      isCorrect,
      feedback: feedbackText,
      correctAnswer: correctAnswerNumber,
    })
  } catch (error) {
    console.error('[math-problem/submit] error:', error)
    return NextResponse.json(
      { message: 'We could not process that submission. Please try again.' },
      { status: 500 }
    )
  }
}

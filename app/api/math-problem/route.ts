import { NextResponse } from 'next/server'
import { mathTutorModel } from '@/lib/gemini'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/supabaseClient'

type GeneratedProblem = {
  problem_text: string
  final_answer: number | string
}

const problemPrompt = `You are an expert Primary 5 math tutor.
Create one engaging multi-sentence math word problem appropriate for a 10-11 year old.
Return *only* strict JSON with the following schema:
{
  "problem_text": "<problem statement>",
  "final_answer": <numeric final answer only>
}
Requirements:
- Keep numbers realistic for Primary 5 level.
- Ensure the problem requires at least two steps of reasoning.
- Make "final_answer" a number (not a string) and the unique correct answer.
- Do not include units in the final answer (they should be part of the explanation in the problem text if needed).
If you cannot comply, respond with the literal text "ERROR".`

function extractJsonPayload(rawText: string): GeneratedProblem {
  const fencedMatch = rawText.match(/```json([\s\S]*?)```/i) ?? rawText.match(/```([\s\S]*?)```/i)
  const candidate = fencedMatch ? fencedMatch[1] : rawText
  const firstBrace = candidate.indexOf('{')
  const lastBrace = candidate.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('AI response missing JSON object')
  }

  const jsonSlice = candidate.slice(firstBrace, lastBrace + 1)
  return JSON.parse(jsonSlice) as GeneratedProblem
}

export async function POST() {
  try {
    const result = await mathTutorModel.generateContent(problemPrompt)
    const rawText = result.response.text()

    if (!rawText || rawText.trim() === 'ERROR') {
      throw new Error('AI model failed to generate a problem')
    }

    const parsed = extractJsonPayload(rawText)
    const problemText = parsed.problem_text?.trim()
    const finalAnswer = Number(parsed.final_answer)

    if (!problemText) {
      throw new Error('Problem text missing from AI response')
    }

    if (!Number.isFinite(finalAnswer)) {
      throw new Error('Final answer is not a valid number')
    }

    const insertResult = await supabase
      .from('math_problem_sessions')
      .insert<Database['public']['Tables']['math_problem_sessions']['Insert'][]>([
        {
          problem_text: problemText,
          final_answer: finalAnswer,
        },
      ])
      .select('id, problem_text')
      .single()

    if (insertResult.error || !insertResult.data) {
      throw insertResult.error ?? new Error('Failed to persist session')
    }

    return NextResponse.json({
      sessionId: insertResult.data.id,
      problem: {
        problem_text: insertResult.data.problem_text,
      },
    })
  } catch (error) {
    console.error('[math-problem] generation error:', error)
    return NextResponse.json(
      { message: 'Unable to generate a math problem right now.' },
      { status: 500 }
    )
  }
}

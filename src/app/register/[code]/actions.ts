'use server';

export type SubmitState = { error?: string; fieldErrors?: Record<string, string> };

export async function submitAction(
  _prev: SubmitState | undefined,
  _formData: FormData,
): Promise<SubmitState> {
  return { error: 'Submission not wired yet (M4 Task 8)' };
}

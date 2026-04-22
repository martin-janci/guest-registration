'use server';
import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentSession } from '@/modules/auth/current';
import { getTaskById, updateTaskStatus, addPhoto, deletePhoto } from '@/modules/housekeeping/service';
import { uploadFile } from '@/modules/storage/service';
import { uploadFileValidation } from '@/modules/storage/schema';

export type PhotoState = { error?: string };

async function requireAssignee(taskId: number): Promise<void> {
  const { user } = await getCurrentSession();
  if (!user) throw new Error('Unauthenticated');
  if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') return;
  const task = await getTaskById(taskId);
  if (!task || task.housekeeperId !== user.id) throw new Error('Forbidden');
}

export async function startTaskAction(taskId: number, _formData: FormData): Promise<void> {
  await requireAssignee(taskId);
  await updateTaskStatus(taskId, 'IN_PROGRESS');
  revalidatePath(`/housekeeper/tasks/${taskId}`);
  revalidatePath('/housekeeper/dashboard');
}

export async function completeTaskAction(taskId: number, _formData: FormData): Promise<void> {
  await requireAssignee(taskId);
  await updateTaskStatus(taskId, 'COMPLETED');
  revalidatePath(`/housekeeper/tasks/${taskId}`);
  revalidatePath('/housekeeper/dashboard');
}

export async function uploadPhotoAction(
  taskId: number, _prev: PhotoState | undefined, formData: FormData,
): Promise<PhotoState> {
  await requireAssignee(taskId);
  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file selected' };
  const v = uploadFileValidation.safeParse(file);
  if (!v.success) return { error: v.error.issues[0]?.message ?? 'Invalid file' };
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().slice(0, 5);
  const slug = crypto.randomBytes(6).toString('hex');
  const key = `housekeeping/${taskId}/${Date.now()}-${slug}.${ext}`;
  await uploadFile(key, file);
  await addPhoto(taskId, key);
  revalidatePath(`/housekeeper/tasks/${taskId}`);
  return {};
}

export async function deletePhotoAction(
  taskId: number, photoId: number, _formData: FormData,
): Promise<void> {
  await requireAssignee(taskId);
  await deletePhoto(photoId);
  revalidatePath(`/housekeeper/tasks/${taskId}`);
}

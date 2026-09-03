'use server';

// Next.js Server Actions
// <form action={...}> 으로 연결되어 서버에서 실행되며, lib/data.ts 의
// 데이터 액세스 함수를 호출한 뒤 관련 페이지를 새로고침(revalidate)합니다.
// Supabase 연동 후에도 이 파일은 수정할 필요 없이 그대로 사용할 수 있습니다.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  answerQna,
  createComment,
  createCommunity,
  createDiscussion,
  createMeetup,
  createPost,
  createQna,
  joinMeetup,
  setInterests,
  toggleInterest,
  updateCheckinSettings,
} from './data';
import { currentUser } from './mockData';
import type { Discussion, Meetup } from './types';

export async function createPostAction(formData: FormData) {
  const communityId = String(formData.get('communityId'));
  const content = String(formData.get('content') ?? '').trim();
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();
  if (!content) return;

  const post = await createPost({
    communityId,
    userId: currentUser.id,
    content,
    imageUrl: imageUrl || undefined,
  });

  revalidatePath(`/communities/${communityId}`);
  redirect(`/posts/${post.id}`);
}

export async function createCommentAction(formData: FormData) {
  const postId = String(formData.get('postId'));
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return;

  await createComment({ postId, userId: currentUser.id, content });
  revalidatePath(`/posts/${postId}`);
}

export async function createMeetupAction(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();
  const date = String(formData.get('date') ?? '');
  const capacity = Number(formData.get('capacity') ?? 10);
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? '식사') as Meetup['category'];
  if (!title || !region || !date) return;

  const meetup = await createMeetup({
    title,
    hostId: currentUser.id,
    region,
    date,
    capacity,
    description,
    category,
  });

  revalidatePath('/meetups');
  redirect(`/meetups/${meetup.id}`);
}

export async function joinMeetupAction(formData: FormData) {
  const meetupId = String(formData.get('meetupId'));
  await joinMeetup(meetupId);
  revalidatePath(`/meetups/${meetupId}`);
}

export async function createDiscussionAction(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const category = String(formData.get('category') ?? '일상') as Discussion['category'];
  const isAnonymous = formData.get('isAnonymous') === 'on';
  if (!title || !content) return;

  const discussion = await createDiscussion({
    userId: currentUser.id,
    category,
    title,
    content,
    isAnonymous,
  });

  revalidatePath('/discussions');
  redirect(`/discussions/${discussion.id}`);
}

export async function createQnaAction(formData: FormData) {
  const question = String(formData.get('question') ?? '').trim();
  if (!question) return;

  await createQna({ userId: currentUser.id, question });
  revalidatePath('/qna');
  redirect('/qna');
}

export async function answerQnaAction(formData: FormData) {
  const id = String(formData.get('id'));
  const answer = String(formData.get('answer') ?? '').trim();
  if (!answer) return;

  await answerQna(id, answer);
  revalidatePath(`/qna/${id}`);
}

// 인기 주제 칩을 누르면 이 액션으로 관심사에 등록/해제합니다.
export async function toggleInterestAction(formData: FormData) {
  const category = String(formData.get('category') ?? '').trim();
  const query = String(formData.get('query') ?? '');
  const myOnly = formData.get('myOnly') === '1';
  if (!category) return;

  await toggleInterest(currentUser.id, category);

  revalidatePath('/communities');
  revalidatePath('/mypage');
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (myOnly) params.set('myOnly', '1');
  redirect(`/communities${params.toString() ? `?${params.toString()}` : ''}`);
}

// 검색해도 원하는 주제가 없을 때, 회원이 직접 새 주제를 추가합니다.
export async function addCustomCommunityAction(formData: FormData) {
  const category = String(formData.get('category') ?? '').trim();
  if (!category) return;

  const community = await createCommunity({ category, userId: currentUser.id });
  if (!currentUser.interests.includes(community.category)) {
    await toggleInterest(currentUser.id, community.category);
  }

  revalidatePath('/communities');
  revalidatePath('/mypage');
  redirect(`/communities?query=${encodeURIComponent(community.category)}`);
}

// 온보딩 마지막 단계에서 고른 관심사를 한 번에 저장합니다.
export async function finishOnboardingAction(interests: string[]) {
  await setInterests(currentUser.id, interests);
  revalidatePath('/communities');
  revalidatePath('/mypage');
}

export async function updateCheckinAction(formData: FormData) {
  const checkinIntervalHours = Number(formData.get('checkinIntervalHours') ?? 24);
  const guardianContact = String(formData.get('guardianContact') ?? '').trim();

  await updateCheckinSettings(currentUser.id, {
    checkinIntervalHours,
    guardianContact,
  });

  revalidatePath('/settings/checkin');
  revalidatePath('/mypage');
}

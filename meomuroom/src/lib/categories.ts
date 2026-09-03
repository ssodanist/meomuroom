// 카테고리 아이콘/색상 시스템
//
// 배경 톤은 3가지 팔레트를 이름 해시로 순환 배정합니다 — 아이콘만 지정해두면
// 회원이 검색 후 직접 추가하는 새 주제도 자동으로 일관된 스타일을 갖습니다.

export const TONES = [
  'linear-gradient(135deg,#3B6440,#2A4A2E)', // pine
  'linear-gradient(135deg,#C48F35,#9C6E1F)', // ochre
  'linear-gradient(135deg,#3B5A63,#28414A)', // teal
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  파크골프: '⛳',
  건강: '❤️',
  노래교실: '🎤',
  여행: '✈️',
  라인댄스: '💃',
  사진: '📷',
  운동: '🤸',
  그라운드골프: '🏌️',
  스마트폰활용: '📱',
  반려동물: '🐾',
  원예: '🌱',
  요리: '🍳',
  게이트볼: '🏑',
  독서: '📖',
  '서예·캘리그라피': '🖌️',
  도자기공예: '🏺',
  '바둑·장기': '♟️',
  '등산·트레킹': '🥾',
  트로트팬클럽: '🎶',
  영화드라마감상: '🎬',
  자전거: '🚴',
  낚시: '🎣',
  '수영·아쿠아로빅': '🏊',
  자원봉사: '🤝',
  '캠핑·차박': '🚐',
  반려식물: '🪴',
  탁구: '🏓',
  손주육아품앗이: '👶',
  요가: '🧘',
  볼링: '🎳',
  명상웃음치료: '😊',
  커피티클래스: '☕',
  영어회화: '🗣️',
  배드민턴: '🏸',
  시니어유튜버: '🎥',
  당구: '🎱',
  유화수채화: '🎨',
  비즈손뜨개: '🧶',
  우쿨렐레기타: '🎸',
  컴퓨터코딩배우기: '💻',
  자동차드라이브: '🚗',
  색소폰: '🎷',
  한자교실: '🈶',
  와인클래스: '🍷',
  오카리나하모니카: '🎼',
  서각목공예: '🪵',
  사군자문인화: '🖼️',
  다문화교류: '🌏',
  가죽공예: '👝',
  드론: '🛸',
};

function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function categoryStyle(category: string): { bg: string; icon: string } {
  return {
    bg: TONES[nameHash(category) % TONES.length],
    icon: CATEGORY_ICONS[category] ?? '⭐',
  };
}

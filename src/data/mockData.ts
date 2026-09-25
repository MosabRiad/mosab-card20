import { CardBatchGroup, LiveExtractionFeed, DealerUser, UserExcelRow } from '../types';

export const INITIAL_DEALER: DealerUser = {
  id: 'dealer-smartnet',
  username: 'Smart Net',
  name: 'Smart Net',
  dealerId: 'Smart Net',
  remainingQuota: 5000,
  totalExtractedCount: 17305,
};

export const LIVE_EXTRACTION_FEEDS: LiveExtractionFeed[] = [
  { id: 'f1', dealerName: 'm***i 🎉', count: 17305, timestamp: 'قبل دقيقة' },
  { id: 'f2', dealerName: 'M***n 🎉', count: 5049, timestamp: 'قبل 3 دقائق' },
  { id: 'f3', dealerName: 'a***d 🎉', count: 12110, timestamp: 'قبل 7 دقائق' },
  { id: 'f4', dealerName: 'E***s 🎉', count: 8420, timestamp: 'قبل 12 دقيقة' },
  { id: 'f5', dealerName: 'k***m 🎉', count: 3200, timestamp: 'قبل 15 دقيقة' },
  { id: 'f6', dealerName: 's***h 🎉', count: 9150, timestamp: 'قبل 20 دقيقة' },
];

function generateMockCards(count: number, packageTitle: string, dateStr: string): UserExcelRow[] {
  const cards: UserExcelRow[] = [];
  for (let i = 1; i <= count; i++) {
    const isUnused = i % 4 !== 0; // ~75% unused old cards
    const randomPin = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    cards.push({
      username: `card_${dateStr.replace(/-/g, '')}_${i}_${randomPin}`,
      password: `${Math.floor(100000 + Math.random() * 900000)}`,
      profileName: packageTitle,
      createdAt: `${dateStr} 08:00`,
      firstConnectAt: isUnused ? null : `${dateStr} 09:30`,
      status: 'active',
    });
  }
  return cards;
}

export const INITIAL_BATCH_GROUPS: CardBatchGroup[] = [
  {
    id: 'b1',
    profileName: 'اشتراك يومي 8 ساعات 2 ميجا',
    cardCount: 155,
    createdDate: '2026-09-20',
    createdTime: '08:00',
    selected: false,
    cards: generateMockCards(155, 'اشتراك يومي 8 ساعات 2 ميجا', '2026-09-20'),
  },
  {
    id: 'b2',
    profileName: 'اشتراك يومي 8 ساعات 2 ميجا',
    cardCount: 146,
    createdDate: '2026-09-19',
    createdTime: '08:00',
    selected: false,
    cards: generateMockCards(146, 'اشتراك يومي 8 ساعات 2 ميجا', '2026-09-19'),
  },
  {
    id: 'b3',
    profileName: 'اشتراك يومي 8 ساعات 2 ميجا',
    cardCount: 139,
    createdDate: '2026-09-18',
    createdTime: '08:00',
    selected: false,
    cards: generateMockCards(139, 'اشتراك يومي 8 ساعات 2 ميجا', '2026-09-18'),
  },
  {
    id: 'b4',
    profileName: 'اشتراك 24 ساعة 5 ميجا',
    cardCount: 210,
    createdDate: '2026-09-17',
    createdTime: '10:30',
    selected: false,
    cards: generateMockCards(210, 'اشتراك 24 ساعة 5 ميجا', '2026-09-17'),
  },
  {
    id: 'b5',
    profileName: 'اشتراك أسبوعي 10 ميجا',
    cardCount: 88,
    createdDate: '2026-09-15',
    createdTime: '14:15',
    selected: false,
    cards: generateMockCards(88, 'اشتراك أسبوعي 10 ميجا', '2026-09-15'),
  },
  {
    id: 'b6',
    profileName: 'اشتراك شهري 3 ميجا',
    cardCount: 320,
    createdDate: '2026-09-10',
    createdTime: '09:00',
    selected: false,
    cards: generateMockCards(320, 'اشتراك شهري 3 ميجا', '2026-09-10'),
  },
];

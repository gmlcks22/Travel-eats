/**
 * 음식 카테고리 및 추천 알고리즘 관련 헬퍼 함수
 */

// 음식 카테고리 정의 (한식, 중식, 일식, 양식, 기타)
export const FOOD_CATEGORIES = {
  KOREAN: "한식",
  CHINESE: "중식",
  JAPANESE: "일식",
  WESTERN: "양식",
  ASIAN: "아시아식",
  FUSION: "퓨전",
  FAST_FOOD: "패스트푸드",
  CAFE: "카페/디저트",
};

// 음식 세부 키워드 (선호도 체크용)
export const FOOD_KEYWORDS = {
  SPICY: "매운맛",
  SEAFOOD: "해산물",
  MEAT: "육류",
  VEGETARIAN: "채식",
  DAIRY: "유제품",
  GLUTEN: "밀가루",
  NUTS: "견과류",
  RAW: "날것",
};

/**
 * 사용자 선호도 점수 계산 로직
 * @param {Object} userPreference - 사용자 선호도 객체
 * @param {Object} restaurant - 식당 정보 객체
 * @returns {number} - 선호도 점수 (0-100)
 */
export function calculatePreferenceScore(userPreference, restaurant) {
  let score = 50; // 기본 점수

  // 1. 좋아하는 카테고리 체크 (+30점)
  if (userPreference.likedCategories?.includes(restaurant.category)) {
    score += 30;
  }

  // 2. 싫어하는 카테고리 체크 (-40점)
  if (userPreference.dislikedCategories?.includes(restaurant.category)) {
    score -= 40;
  }

  // 3. 싫어하는 키워드 체크 (-20점)
  const disliked = userPreference.dislikedKeywords || [];
  const hasDisliked = disliked.some((keyword) =>
    restaurant.keywords?.includes(keyword)
  );
  if (hasDisliked) {
    score -= 20;
  }

  // 4. 좋아하는 키워드 체크 (+15점)
  const liked = userPreference.likedKeywords || [];
  const hasLiked = liked.some((keyword) =>
    restaurant.keywords?.includes(keyword)
  );
  if (hasLiked) {
    score += 15;
  }

  // 5. 예산 범위 체크 (+10점 or -10점)
  if (userPreference.budgetRange) {
    const [minBudget, maxBudget] = userPreference.budgetRange;
    if (restaurant.avgPrice >= minBudget && restaurant.avgPrice <= maxBudget) {
      score += 10;
    } else {
      score -= 10;
    }
  }

  // 점수 범위를 0-100으로 제한
  return Math.max(0, Math.min(100, score));
}

/**
 * 그룹 합의 점수 계산 로직
 * @param {Array} groupMembers - 그룹 멤버 배열
 * @param {Object} restaurant - 식당 정보 객체
 * @returns {Object} - { totalScore, likedMembers, dislikedMembers }
 */
export function calculateGroupConsensus(groupMembers, restaurant) {
  let totalScore = 0;
  const likedMembers = []; // 이 식당을 좋아하는 멤버
  const dislikedMembers = []; // 이 식당을 싫어하는 멤버

  groupMembers.forEach((member) => {
    const memberScore = calculatePreferenceScore(member.preference, restaurant);
    totalScore += memberScore;

    if (memberScore >= 70) {
      likedMembers.push(member);
    } else if (memberScore < 30) {
      dislikedMembers.push(member);
    }
  });

  // 그룹 평균 점수 계산
  const avgScore =
    groupMembers.length > 0 ? Math.round(totalScore / groupMembers.length) : 0;

  return {
    totalScore: avgScore,
    likedMembers,
    dislikedMembers,
    memberCount: groupMembers.length,
  };
}

/**
 * 식당 목록을 그룹 합의 점수 기준으로 정렬
 * @param {Array} restaurants - 식당 목록
 * @param {Array} groupMembers - 그룹 멤버 목록
 * @returns {Array} - 정렬된 식당 목록 (합의 점수 포함)
 */
export function sortRestaurantsByConsensus(restaurants, groupMembers) {
  return restaurants
    .map((restaurant) => ({
      ...restaurant,
      consensus: calculateGroupConsensus(groupMembers, restaurant),
    }))
    .sort((a, b) => b.consensus.totalScore - a.consensus.totalScore);
}

/**
 * 랜덤 식당 데이터 생성 (Google Places API 대신 사용)
 * @param {number} count - 생성할 식당 수
 * @param {string} region - 지역명
 * @returns {Array} - 식당 객체 배열
 */
export function generateMockRestaurants(count = 20, region = "서울") {
  const categories = Object.values(FOOD_CATEGORIES);
  const keywords = Object.values(FOOD_KEYWORDS);

  const restaurantNames = {
    한식: ["한옥마을", "전통한정식", "할매국밥", "정갈한밥상", "고향집"],
    중식: ["차이나타운", "북경반점", "상하이", "만리장성", "홍콩반점"],
    일식: ["스시야", "라멘집", "이자카야", "돈카츠하우스", "우동명가"],
    양식: [
      "트라토리아",
      "비스트로",
      "스테이크하우스",
      "파스타집",
      "브런치카페",
    ],
    아시아식: ["팟타이", "월남쌈", "분짜", "쌀국수", "카오산로드"],
    퓨전: [
      "모던키친",
      "크리에이티브다이닝",
      "퓨전레스토랑",
      "컨템포러리",
      "크로스오버",
    ],
    패스트푸드: ["버거킹", "맥도날드", "롯데리아", "KFC", "서브웨이"],
    "카페/디저트": [
      "달콤카페",
      "디저트39",
      "케이크하우스",
      "와플&커피",
      "브런치앤커피",
    ],
  };

  const restaurants = [];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const names = restaurantNames[category] || ["맛집"];
    const name =
      names[Math.floor(Math.random() * names.length)] + ` ${region}점`;

    // 랜덤 키워드 선택 (1-3개)
    const numKeywords = Math.floor(Math.random() * 3) + 1;
    const selectedKeywords = [];
    for (let j = 0; j < numKeywords; j++) {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      if (!selectedKeywords.includes(keyword)) {
        selectedKeywords.push(keyword);
      }
    }

    restaurants.push({
      id: `rest_${i + 1}`,
      name,
      category,
      keywords: selectedKeywords,
      avgPrice: Math.floor(Math.random() * 40000) + 10000, // 10,000 ~ 50,000원
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 ~ 5.0
      location: {
        lat: 37.5665 + (Math.random() - 0.5) * 0.1,
        lng: 126.978 + (Math.random() - 0.5) * 0.1,
        address: `${region} ${
          ["강남구", "종로구", "마포구", "서초구", "용산구"][
            Math.floor(Math.random() * 5)
          ]
        } ${Math.floor(Math.random() * 100)}번길`,
      },
      description: `${category} 전문점으로 ${selectedKeywords.join(
        ", "
      )} 메뉴가 특징입니다.`,
      images: [
        `https://via.placeholder.com/400x300?text=${encodeURIComponent(name)}`,
      ],
    });
  }

  return restaurants;
}

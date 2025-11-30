/**
 * 라우팅 경로 상수 정의
 * 애플리케이션의 모든 페이지 경로를 중앙에서 관리
 */
const routes = {
  // 메인 페이지
  home: "/",
  
  // 인증 관련 페이지
  login: "/login",
  register: "/register",
  
  // 그룹 관리 페이지
  groupCreate: "/group/create",      // 그룹 생성
  groupJoin: "/group/join",          // 그룹 참여
  groupDetail: "/group/:groupId",    // 그룹 상세 정보
  groupManage: "/group/:groupId/manage", // 그룹 관리
  
  // 여행지 및 음식 추천 페이지
  tripPlan: "/group/:groupId/trip",     // 여행 계획 수립
  groupFoodPreference: "/group/:groupId/preference", // 그룹 내 음식 선호도 입력
  onboardingPreference: "/preference", // 온보딩 시 음식 선호도 입력
  loading: "/group/:groupId/loading/:dayIndex",   // 추천 계산 중
  foodResult: "/group/:groupId/result", // 추천 식당 목록
  foodDetail: "/group/:groupId/restaurant/:restaurantId", // 식당 상세 정보
  
  // 마이페이지
  mypage: "/mypage",              // 마이페이지 메인
  mypageEdit: "/mypage/edit",     // 개인정보 수정
  myGroups: "/mypage/groups",     // 참여 그룹 목록
};

export default routes;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import routes from "@utils/constants/routes";
import { getGroupById, updateGroup } from "@utils/helpers/storage";
import { searchPlaces } from "@utils/api/googlePlaces"; // API 호출 함수 임포트
import { Loader2 } from "lucide-react";

// 딜레이 함수
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 추천 쿼리 생성 헬퍼 함수
 * @param {Array} members - 그룹 멤버 목록 (선호도 포함)
 * @param {string} tripRegion - 여행 지역
 * @returns {string} - Google Places API에 사용할 검색 쿼리
 */
const createSearchQuery = (members, tripRegion) => {
  const categoryCounts = {};
  
  members.forEach(member => {
    if (member.preference?.likedCategories) {
      member.preference.likedCategories.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    }
  });

  // 가장 많이 선택된 카테고리 찾기
  let mostLikedCategory = "";
  let maxCount = 0;
  for (const category in categoryCounts) {
    if (categoryCounts[category] > maxCount) {
      mostLikedCategory = category;
      maxCount = categoryCounts[category];
    }
  }

  if (mostLikedCategory) {
    return `${tripRegion} ${mostLikedCategory} 맛집`;
  }
  
  // 선호 카테고리가 없는 경우
  return `${tripRegion} 맛집`;
};

/**
 * 로딩 페이지
 * - 그룹 선호도를 종합하여 Google Places API로 식당을 검색하고 결과를 저장
 */
export default function LoadingPage({ token }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("데이터 준비 중...");

  useEffect(() => {
    const processRecommendation = async () => {
      if (!token) {
        alert("인증 정보가 없습니다. 다시 로그인해주세요.");
        navigate(routes.login);
        return;
      }
      try {
        // 1. 그룹 정보 및 멤버 선호도 로드 (20%)
        setProgress(20);
        setMessage("그룹 멤버들의 선호도를 종합하는 중...");
        await sleep(500);

        const groupResult = getGroupById(token, groupId);
        if (!groupResult.success) {
          throw new Error(groupResult.message);
        }
        
        const group = groupResult.group;
        if (!group.tripPlan?.region) {
          throw new Error("여행 계획(지역)이 설정되지 않았습니다.");
        }

        const members = group.members;
        const membersWithoutPreference = members.filter(m => !m.preference);
        if (membersWithoutPreference.length > 0) {
          throw new Error(`선호도를 입력하지 않은 멤버가 있습니다: ${membersWithoutPreference.map(m => m.nickname).join(", ")}`);
        }

        // 2. Google Places API 검색 쿼리 생성 (40%)
        setProgress(40);
        const query = createSearchQuery(members, group.tripPlan.region);
        setMessage(`"${query}" (으)로 맛집을 검색합니다...`);
        await sleep(800);

        // 3. Google Places API 호출 (70%)
        setProgress(70);
        const placesResult = await searchPlaces(query);
        if (!placesResult.success) {
          throw new Error(placesResult.message);
        }
        
        // (선택사항) 클라이언트 사이드 필터링: "못 먹는 음식" 키워드가 포함된 식당 제외
        const allCannotEatKeywords = members.flatMap(m => m.preference.cannotEat || []);
        const uniqueCannotEatKeywords = [...new Set(allCannotEatKeywords)];
        
        let filteredPlaces = placesResult.places;
        if (uniqueCannotEatKeywords.length > 0) {
            setMessage("못 먹는 음식을 제외하는 중...");
            await sleep(500);
            filteredPlaces = placesResult.places.filter(place => {
                const placeText = `${place.name} ${place.formatted_address}`.toLowerCase();
                return !uniqueCannotEatKeywords.some(keyword => placeText.includes(keyword.toLowerCase()));
            });
        }

        // 4. 결과 저장 (90%)
        setProgress(90);
        setMessage("추천 결과를 저장하는 중...");
        await sleep(500);

        const updateResult = updateGroup(token, groupId, {
          restaurants: filteredPlaces, // API 결과를 저장
          lastRecommendation: new Date().toISOString(),
        });

        if (!updateResult.success) {
          throw new Error("결과 저장 실패: " + updateResult.message);
        }

        // 5. 완료 (100%)
        setProgress(100);
        setMessage("완료! 추천 결과로 이동합니다...");
        await sleep(500);

        // state로 데이터를 전달하는 대신, 결과 페이지에서 직접 storage를 읽도록 변경
        // navigate(routes.foodResult.replace(":groupId", groupId), { state: { restaurants: filteredPlaces } });
        navigate(routes.foodResult.replace(":groupId", groupId));

      } catch (error) {
        console.error("추천 처리 중 오류:", error);
        alert(`오류: ${error.message}`);
        navigate(routes.groupDetail.replace(":groupId", groupId));
      }
    };

    processRecommendation();
  }, [groupId, token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Loader2 className="w-20 h-20 text-indigo-600 animate-spin mx-auto" />
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI가 분석하는 중...</h1>
          <p className="text-lg text-gray-600">{message}</p>
        </div>
        <div className="w-96 bg-white rounded-full h-4 border-2 border-indigo-300 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{progress}%</p>
        <div className="mt-10 max-w-md mx-auto bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>잠깐만요!</strong>
            <br />
            AI가 모든 멤버의 선호도를 분석하여 최적의 식당을 찾고 있습니다.
            <br />
            곧 완벽한 추천을 받을 수 있어요! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
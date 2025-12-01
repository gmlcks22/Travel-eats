import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import routes from "@utils/constants/routes";
import { getGroupById, updateGroup } from "@utils/helpers/storage";
import { searchPlacesByLocation } from "@utils/api/googlePlaces";
import { Loader2 } from "lucide-react";

// 딜레이 함수
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 선호도 기반 주요 키워드 생성
 * @param {Array} members - 그룹 멤버 목록 (선호도 포함)
 * @returns {string} - 검색에 사용할 키워드 (예: "한식" 또는 "파스타")
 */
const getPrimaryKeyword = (members) => {
  const categoryCounts = {};
  members.forEach((member) => {
    member.preference?.likedCategories?.forEach((category) => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  });

  let mostLikedCategory = "";
  let maxCount = 0;
  for (const category in categoryCounts) {
    if (categoryCounts[category] > maxCount) {
      mostLikedCategory = category;
      maxCount = categoryCounts[category];
    }
  }
  return mostLikedCategory; // "한식", "일식" 등
};

/**
 * 로딩 페이지 (전체 일정 추천)
 */
export default function LoadingPage({ token }) {
  const navigate = useNavigate();
  const { groupId, dayIndex } = useParams();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("데이터 준비 중...");

  useEffect(() => {
    const processRecommendation = async () => {
      console.log("🔐 LoadingPage 시작");
      console.log("🔐 현재 URL:", window.location.href);
      console.log("🔐 token 존재 여부:", !!token);
      console.log("🔐 groupId:", groupId);
      console.log("🔐 dayIndex:", dayIndex);

      // 필수 파라미터 검증
      if (!groupId || !dayIndex) {
        console.error("❌ 필수 파라미터 누락!");
        alert("잘못된 접근입니다.");
        navigate(routes.home);
        return;
      }

      if (!token) {
        console.error("❌ token이 없습니다!");
        alert("인증 정보가 없습니다. 다시 로그인해주세요.");
        navigate(routes.login);
        return;
      }
      try {
        // 1. 그룹 정보 로드 (10%)
        setProgress(10);
        setMessage("그룹 정보를 불러오는 중...");
        await sleep(500);

        const groupResult = getGroupById(token, groupId);
        if (!groupResult.success) throw new Error(groupResult.message);

        const group = groupResult.group;
        const tripDays = group.tripPlan?.days;

        if (!tripDays || tripDays.length === 0) {
          throw new Error("여행 계획이 설정되지 않았습니다.");
        }

        const members = group.members;
        const membersWithoutPreference = members.filter((m) => !m.preference);
        if (membersWithoutPreference.length > 0) {
          throw new Error(
            `선호도를 입력하지 않은 멤버가 있습니다: ${membersWithoutPreference
              .map((m) => m.nickname)
              .join(", ")}`
          );
        }

        // 2. dayIndex가 "all"이면 모든 날짜 처리
        const isAllDays = dayIndex === "all";

        console.log("📅 날짜 처리 정보:");
        console.log("  dayIndex:", dayIndex);
        console.log("  isAllDays:", isAllDays);
        console.log("  tripDays.length:", tripDays.length);
        console.log(
          "  tripDays:",
          tripDays.map((d, i) => `${i}일차: ${d.description}`)
        );

        const daysToProcess = isAllDays
          ? tripDays
          : [tripDays[parseInt(dayIndex)]];

        console.log("  daysToProcess.length:", daysToProcess.length);
        console.log(
          "  daysToProcess:",
          daysToProcess.map((d, i) => `${i}: ${d.description}`)
        );

        if (!isAllDays && !tripDays[dayIndex]) {
          throw new Error("해당 날짜의 여행 계획이 없습니다.");
        }

        setProgress(20);
        setMessage(
          `${
            isAllDays ? "모든 날짜" : `${parseInt(dayIndex) + 1}일차`
          }의 선호도를 분석하는 중...`
        );
        await sleep(500);

        // 3. 각 날짜별로 식당 검색
        const keyword = getPrimaryKeyword(members);
        const allRestaurantsByDay = {};

        for (let i = 0; i < daysToProcess.length; i++) {
          const day = daysToProcess[i];
          // ✅ 수정: isAllDays일 때 i를 사용, 아니면 parseInt(dayIndex)
          const dayIdx = isAllDays ? i : parseInt(dayIndex);

          console.log(
            `🔄 처리 중: i=${i}, dayIdx=${dayIdx}, day=${day.description}`
          );

          setProgress(30 + (i / daysToProcess.length) * 40);
          setMessage(
            `${isAllDays ? `${dayIdx + 1}일차` : ""} '${
              day.description
            }' 근처 식당 검색 중...`
          );
          await sleep(300);

          const placesResult = await searchPlacesByLocation({
            location: day.location,
            radius: day.radius,
            keyword: keyword || "restaurant",
          });

          if (!placesResult.success) {
            throw new Error(placesResult.message);
          }

          // 필터링
          const allDislikedKeywords = members.flatMap(
            (m) => m.preference.dislikedKeywords || []
          );
          const uniqueDislikedKeywords = [...new Set(allDislikedKeywords)];

          let filteredPlaces = placesResult.places;
          if (uniqueDislikedKeywords.length > 0) {
            filteredPlaces = placesResult.places.filter((place) => {
              const placeText = `${place.name} ${place.types.join(
                " "
              )}`.toLowerCase();
              return !uniqueDislikedKeywords.some((kw) =>
                placeText.includes(kw.toLowerCase())
              );
            });
          }

          console.log(`✅ ${dayIdx}일차 저장: ${filteredPlaces.length}개 식당`);
          allRestaurantsByDay[dayIdx] = filteredPlaces;
        }

        console.log("📦 최종 저장 데이터:", Object.keys(allRestaurantsByDay));

        // 4. 결과 저장 (90%)
        setProgress(90);
        setMessage("추천 결과를 저장하는 중...");
        await sleep(500);

        // 저장 전 데이터 검증
        console.log("=== 저장 전 데이터 검증 ===");
        console.log("allRestaurantsByDay:", allRestaurantsByDay);
        console.log("키 목록:", Object.keys(allRestaurantsByDay));
        console.log("여행 일수:", tripDays.length);

        // 각 키의 데이터 개수 확인
        Object.keys(allRestaurantsByDay).forEach((key) => {
          console.log(`  [${key}]: ${allRestaurantsByDay[key].length}개 식당`);
        });

        // 기존 restaurants에 날짜별로 저장
        const updateResult = updateGroup(token, groupId, {
          restaurantsByDay: allRestaurantsByDay, // 새로운 구조
          restaurants: Object.values(allRestaurantsByDay).flat(), // 하위 호환성
          lastRecommendation: new Date().toISOString(),
        });

        if (!updateResult.success) {
          throw new Error("결과 저장 실패: " + updateResult.message);
        }

        console.log("✅ 저장 완료:", updateResult.group.restaurantsByDay);
        console.log(
          "✅ 저장된 키:",
          Object.keys(updateResult.group.restaurantsByDay)
        );

        // 5. 완료 (100%)
        setProgress(100);
        setMessage("완료! 식당 선택 페이지로 이동합니다...");
        await sleep(500);

        navigate(routes.foodResult.replace(":groupId", groupId));
      } catch (error) {
        console.error("추천 처리 중 오류:", error);
        alert(`오류: ${error.message}`);
        navigate(routes.groupDetail.replace(":groupId", groupId));
      }
    };

    processRecommendation();
  }, [groupId, dayIndex, token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Loader2 className="w-20 h-20 text-indigo-600 animate-spin mx-auto" />
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AI가 분석하는 중...
          </h1>
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
            <br />곧 완벽한 추천을 받을 수 있어요! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}

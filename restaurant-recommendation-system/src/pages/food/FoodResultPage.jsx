import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { RestaurantCard, InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import {
  Trophy,
  MapPin,
  Star,
  TrendingUp,
  ArrowLeft,
  Check,
  Calendar,
} from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const adaptPlaceToRestaurant = (place) => {
  let photoUrl = "https://via.placeholder.com/400x300?text=No+Image";
  if (
    API_KEY &&
    API_KEY !== "YOUR_API_KEY" &&
    place.photos &&
    place.photos.length > 0
  ) {
    const photoReference = place.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${API_KEY}`;
  }

  return {
    id: place.place_id,
    place_id: place.place_id,
    name: place.name,
    images: [photoUrl],
    category: place.types ? place.types[0] : "음식점",
    keywords: place.types,
    rating: place.rating || 0,
    user_ratings_total: place.user_ratings_total || 0,
    avgPrice: place.price_level,
    location: {
      address: place.formatted_address,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
  };
};

/**
 * 식당 추천 결과 페이지 (탭 기반 일자별 보기 + 선택 기능)
 */
export default function FoodResultPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [restaurantsByDay, setRestaurantsByDay] = useState({});
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedRestaurants, setSelectedRestaurants] = useState({});
  const [filterRating, setFilterRating] = useState(0);

  const selectedRestaurantsKey = `selectedRestaurants_${groupId}`;

  // 그룹 및 추천 결과 로드
  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        const groupData = result.group;

        console.log("🔍 그룹 데이터 확인:", {
          hasRestaurantsByDay: !!groupData.restaurantsByDay,
          hasRestaurants: !!groupData.restaurants,
          tripDaysLength: groupData.tripPlan?.days?.length,
        });

        // 새로운 구조 restaurantsByDay 우선, 없으면 기존 restaurants 사용
        let restaurantsData = {};

        if (
          groupData.restaurantsByDay &&
          Object.keys(groupData.restaurantsByDay).length > 0
        ) {
          // 새 구조 사용
          restaurantsData = groupData.restaurantsByDay;
          console.log("📍 restaurantsByDay 로드 성공");
          console.log("📍 원본 데이터:", restaurantsData);
          console.log("📍 키 목록:", Object.keys(restaurantsData));
          console.log("📍 키 타입:", typeof Object.keys(restaurantsData)[0]);
        } else if (groupData.restaurants && groupData.restaurants.length > 0) {
          // 하위 호환성: 기존 restaurants를 0일차로 할당
          restaurantsData = { 0: groupData.restaurants };
          console.log("📍 기존 restaurants를 0일차로 변환");
        }

        if (Object.keys(restaurantsData).length === 0) {
          console.error("❌ restaurantsData가 비어있음!");
          alert("아직 추천 결과가 없습니다. 식당 추천을 먼저 받아주세요.");
          navigate(routes.groupDetail.replace(":groupId", groupId));
          return;
        }

        // 여행 일수와 추천 결과 일수가 일치하는지 확인
        const tripDaysCount = groupData.tripPlan?.days?.length || 0;
        const recommendedDaysCount = Object.keys(restaurantsData).length;

        console.log(
          `📅 여행 일수: ${tripDaysCount}, 추천 결과 일수: ${recommendedDaysCount}`
        );

        if (tripDaysCount !== recommendedDaysCount) {
          console.warn("⚠️ 여행 일수와 추천 결과 일수가 다릅니다!");
          console.warn("여행 계획을 다시 확인하거나 추천을 다시 받으세요.");
        }

        // 데이터 변환
        const adaptedRestaurantsByDay = {};
        for (const dayIdx in restaurantsData) {
          const dayRestaurants = restaurantsData[dayIdx];
          console.log(
            `🍽️ [${dayIdx}]일차 변환 중: ${dayRestaurants?.length || 0}개 식당`
          );

          if (Array.isArray(dayRestaurants) && dayRestaurants.length > 0) {
            adaptedRestaurantsByDay[dayIdx] = dayRestaurants.map(
              adaptPlaceToRestaurant
            );
          } else {
            console.warn(
              `⚠️ [${dayIdx}]일차 데이터가 비어있거나 배열이 아닙니다.`
            );
          }
        }

        console.log("✅ 최종 변환 완료");
        console.log(
          "✅ adaptedRestaurantsByDay 키:",
          Object.keys(adaptedRestaurantsByDay)
        );

        // state 설정 직전 로그
        console.log(
          "🎯 setRestaurantsByDay 호출 직전:",
          adaptedRestaurantsByDay
        );

        setGroup(groupData);
        setRestaurantsByDay(adaptedRestaurantsByDay);

        console.log("🎯 state 설정 완료");

        // localStorage에서 선택된 식당 로드
        const saved = localStorage.getItem(selectedRestaurantsKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log("💾 localStorage에서 로드한 선택:", parsed);
          setSelectedRestaurants(parsed);
        }
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, token, navigate, selectedRestaurantsKey]);

  // 식당 선택/해제
  const handleSelectRestaurant = (dayIdx, restaurant) => {
    console.log(
      `🍽️ 식당 선택/해제: dayIdx=${dayIdx}, restaurant=${restaurant.name}`
    );

    const newSelected = { ...selectedRestaurants };

    if (newSelected[dayIdx]?.id === restaurant.id) {
      // 이미 선택된 식당 클릭 시 해제
      console.log(`❌ 선택 해제: ${dayIdx}일차`);
      delete newSelected[dayIdx];
      setSelectedRestaurants(newSelected);
      localStorage.setItem(selectedRestaurantsKey, JSON.stringify(newSelected));
    } else {
      // 새 식당 선택 (하루에 하나만)
      console.log(`✅ 새 선택: ${dayIdx}일차 - ${restaurant.name}`);
      newSelected[dayIdx] = restaurant;
      setSelectedRestaurants(newSelected);
      localStorage.setItem(selectedRestaurantsKey, JSON.stringify(newSelected));

      console.log("💾 localStorage 저장 완료:", newSelected);

      // 다음 일차로 자동 이동
      const allDayIndices = Object.keys(restaurantsByDay)
        .map((idx) => parseInt(idx))
        .sort((a, b) => a - b);
      console.log("📅 전체 일차 목록:", allDayIndices);

      const currentIndex = allDayIndices.indexOf(dayIdx);
      console.log(`📍 현재 인덱스: ${currentIndex}, dayIdx: ${dayIdx}`);

      if (currentIndex !== -1 && currentIndex < allDayIndices.length - 1) {
        const nextDayIdx = allDayIndices[currentIndex + 1];
        console.log(`➡️ 다음 일차로 이동: ${nextDayIdx}일차`);

        // 다음 날짜가 있으면 이동 (0.5초 딜레이)
        setTimeout(() => {
          setActiveDayIndex(nextDayIdx);
          // 페이지 최상단으로 스크롤
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 500);
      } else {
        console.log("🏁 마지막 일차입니다. 이동하지 않습니다.");
      }
    }
  };

  // 선택 완료
  const handleComplete = () => {
    const totalDays = Object.keys(restaurantsByDay).length;
    const selectedDays = Object.keys(selectedRestaurants).length;

    console.log("🎉 선택 완료 버튼 클릭");
    console.log(`📊 전체: ${totalDays}일, 선택: ${selectedDays}일`);
    console.log("선택된 식당:", selectedRestaurants);

    if (selectedDays < totalDays) {
      alert(
        `아직 ${totalDays - selectedDays}개 날짜의 식당을 선택하지 않았습니다.`
      );
      return;
    }

    navigate(routes.finalPlan.replace(":groupId", groupId));
  };

  if (!group || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  // 렌더링 직전 데이터 확인
  console.log("🎨 렌더링 시작");
  console.log("🎨 restaurantsByDay state:", restaurantsByDay);
  console.log("🎨 restaurantsByDay 키:", Object.keys(restaurantsByDay));
  console.log("🎨 activeDayIndex:", activeDayIndex);

  const currentDayRestaurants = restaurantsByDay[activeDayIndex] || [];
  console.log(
    `🎨 현재 보여줄 식당 (${activeDayIndex}일차):`,
    currentDayRestaurants.length,
    "개"
  );

  const filteredRestaurants =
    filterRating === 0
      ? currentDayRestaurants
      : currentDayRestaurants.filter((r) => r.rating >= filterRating);

  const selectedRestaurant = selectedRestaurants[activeDayIndex];
  const totalDays = Object.keys(restaurantsByDay).length;
  const selectedDays = Object.keys(selectedRestaurants).length;
  const allSelected = selectedDays === totalDays;

  console.log(`🎨 totalDays: ${totalDays}, selectedDays: ${selectedDays}`);

  const topRestaurant =
    currentDayRestaurants.length > 0
      ? currentDayRestaurants.reduce((prev, current) =>
          prev.rating > current.rating ? prev : current
        )
      : null;

  const avgRating =
    currentDayRestaurants.length > 0
      ? (
          currentDayRestaurants.reduce((sum, r) => sum + (r.rating || 0), 0) /
          currentDayRestaurants.filter((r) => r.rating > 0).length
        ).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🍽️ 식당 선택하기
            </h1>
            <p className="text-gray-600">
              {group.name} · 각 날짜별로 원하는 식당을 선택하세요
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              navigate(routes.groupDetail.replace(":groupId", groupId))
            }
          >
            <ArrowLeft className="w-5 h-5" />
            그룹으로 돌아가기
          </Button>
        </div>

        {/* 진행 상황 */}
        <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                선택 진행 상황
              </h2>
              <p className="text-sm text-gray-600">
                {selectedDays}/{totalDays}일 선택 완료
              </p>
            </div>
            {allSelected && (
              <Button variant="primary" size="lg" onClick={handleComplete}>
                <Check className="w-5 h-5" />
                선택 완료 - 최종 계획 보기
              </Button>
            )}
          </div>

          {/* 진행 바 */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(selectedDays / totalDays) * 100}%` }}
            />
          </div>
        </div>

        {/* 날짜 탭 */}
        <div className="flex space-x-2 border-b-2 border-gray-200 mb-6 overflow-x-auto">
          {(() => {
            const keys = Object.keys(restaurantsByDay);
            console.log("🏷️ 탭 렌더링 시작");
            console.log("🏷️ restaurantsByDay의 키:", keys);
            console.log("🏷️ 정렬 전:", keys);

            const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
            console.log("🏷️ 정렬 후:", sortedKeys);

            return sortedKeys.map((dayIdx) => {
              const idx = parseInt(dayIdx);
              const isSelected = selectedRestaurants[dayIdx] !== undefined;
              const dayLabel = idx + 1; // 0 -> 1일차, 1 -> 2일차

              console.log(
                `🏷️ 탭 생성: dayIdx=${dayIdx}, idx=${idx}, dayLabel=${dayLabel}일차`
              );

              return (
                <button
                  key={dayIdx}
                  onClick={() => {
                    console.log(
                      `🔄 탭 클릭: ${dayIdx}일차 (${dayLabel}일차로 표시)`
                    );
                    setActiveDayIndex(idx);
                  }}
                  className={`px-6 py-3 font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeDayIndex === idx
                      ? "border-b-4 border-indigo-600 text-indigo-600"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  {dayLabel}일차
                  {isSelected && <Check className="w-4 h-4 text-green-600" />}
                </button>
              );
            });
          })()}
        </div>

        {/* 현재 날짜 정보 */}
        {group.tripPlan?.days?.[activeDayIndex] && (
          <div className="bg-indigo-50 rounded-lg p-4 mb-6 border-2 border-indigo-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-900">
                {activeDayIndex + 1}일차:{" "}
                {group.tripPlan.days[activeDayIndex].description}
              </span>
              {selectedRestaurant && (
                <span className="ml-auto px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                  ✓ {selectedRestaurant.name} 선택됨
                </span>
              )}
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <InfoCard
            title="추천 식당"
            value={`${filteredRestaurants.length}개`}
            icon={<MapPin />}
            color="indigo"
          />
          <InfoCard
            title="평균 별점"
            value={avgRating > 0 ? `${avgRating}점` : "-"}
            icon={<Star />}
            color="green"
          />
          <InfoCard
            title="최고 별점"
            value={topRestaurant ? `${topRestaurant.rating}점` : "-"}
            icon={<Trophy />}
            color="purple"
          />
          <InfoCard
            title="그룹 멤버"
            value={`${group.members.length}명`}
            icon={<TrendingUp />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">필터</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    최소 별점
                  </label>
                  <select
                    value={filterRating}
                    onChange={(e) =>
                      setFilterRating(parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={0}>전체 보기</option>
                    <option value={4.5}>4.5점 이상</option>
                    <option value={4.0}>4.0점 이상</option>
                    <option value={3.5}>3.5점 이상</option>
                    <option value={3.0}>3.0점 이상</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    현재 {filteredRestaurants.length}개의 식당이 표시되고
                    있습니다.
                  </p>
                </div>

                {selectedRestaurant && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-bold text-green-800 mb-1">
                        선택된 식당
                      </p>
                      <p className="text-sm text-green-700">
                        {selectedRestaurant.name}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleSelectRestaurant(
                            activeDayIndex,
                            selectedRestaurant
                          )
                        }
                        className="w-full mt-2"
                      >
                        선택 해제
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 식당 목록 */}
          <div className="lg:col-span-3">
            {filteredRestaurants.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border-2 border-yellow-200 text-center">
                <p className="text-xl text-gray-600">
                  해당 조건의 식당이 없습니다.
                  <br />
                  필터를 조정해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRestaurants.map((restaurant) => {
                  const isSelected = selectedRestaurant?.id === restaurant.id;

                  return (
                    <div
                      key={restaurant.id}
                      className={`transition-all ${
                        isSelected ? "ring-4 ring-green-500 ring-offset-2" : ""
                      }`}
                    >
                      <RestaurantCard
                        restaurant={restaurant}
                        onClick={() =>
                          handleSelectRestaurant(activeDayIndex, restaurant)
                        }
                        showSelectButton={true}
                        isSelected={isSelected}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

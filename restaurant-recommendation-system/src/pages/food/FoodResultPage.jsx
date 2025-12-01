import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import {
  Calendar,
  Star,
  MapPin,
  Check,
  Filter,
  ChevronRight,
  Sunrise,
  Sun,
  Sunset,
  ExternalLink,
  Navigation,
  DollarSign,
} from "lucide-react";

// Google Place를 우리 Restaurant 형식으로 변환
const adaptPlaceToRestaurant = (place) => {
  const getPriceLabel = (priceLevel) => {
    const labels = {
      0: "무료",
      1: "저렴 (~10,000원)",
      2: "보통 (10,000~30,000원)",
      3: "비싼 (30,000~60,000원)",
      4: "고급 (60,000원+)",
    };
    return priceLevel !== null && priceLevel !== undefined
      ? labels[priceLevel]
      : "가격 정보 없음";
  };

  return {
    id: place.place_id,
    name: place.name,
    category: place.types?.[0] || "restaurant",
    rating: place.rating || 0,
    user_ratings_total: place.user_ratings_total || 0,
    priceLevel: place.price_level ?? null,
    priceLabel: getPriceLabel(place.price_level),
    location: {
      address: place.vicinity || place.formatted_address || "",
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
    },
    images:
      place.photos?.map(
        (photo) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${
            photo.photo_reference
          }&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`
      ) || [],
  };
};

// 끼니 옵션
const MEAL_TYPES = [
  {
    id: "breakfast",
    label: "아침",
    icon: Sunrise,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    borderColor: "border-orange-600",
    bgLight: "bg-orange-50",
  },
  {
    id: "lunch",
    label: "점심",
    icon: Sun,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-600",
    bgLight: "bg-yellow-50",
  },
  {
    id: "dinner",
    label: "저녁",
    icon: Sunset,
    color: "bg-indigo-500",
    textColor: "text-indigo-600",
    borderColor: "border-indigo-600",
    bgLight: "bg-indigo-50",
  },
];

/**
 * 식당 선택 페이지 - 끼니별 선택
 */
export default function FoodResultPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [restaurantsByDay, setRestaurantsByDay] = useState({});
  const [selectedRestaurants, setSelectedRestaurants] = useState({});
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeMealType, setActiveMealType] = useState("breakfast"); // 현재 선택 중인 끼니
  const [filterRating, setFilterRating] = useState(0);
  const [filterPrice, setFilterPrice] = useState(0); // 0 = 전체

  const selectedRestaurantsKey = `selectedRestaurants_${groupId}`;

  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (!result.success) {
        alert(result.message);
        navigate(routes.home);
        return;
      }

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
        restaurantsData = groupData.restaurantsByDay;
        console.log("📍 restaurantsByDay 로드 성공");
      } else if (groupData.restaurants && groupData.restaurants.length > 0) {
        restaurantsData = { 0: groupData.restaurants };
        console.log("📍 기존 restaurants를 0일차로 변환");
      }

      if (Object.keys(restaurantsData).length === 0) {
        alert("아직 추천 결과가 없습니다. 식당 추천을 먼저 받아주세요.");
        navigate(routes.groupDetail.replace(":groupId", groupId));
        return;
      }

      // 데이터 변환
      const adaptedRestaurantsByDay = {};
      for (const dayIdx in restaurantsData) {
        const dayRestaurants = restaurantsData[dayIdx];
        if (Array.isArray(dayRestaurants) && dayRestaurants.length > 0) {
          adaptedRestaurantsByDay[dayIdx] = dayRestaurants.map(
            adaptPlaceToRestaurant
          );
        }
      }

      setGroup(groupData);
      setRestaurantsByDay(adaptedRestaurantsByDay);

      // localStorage에서 선택된 식당 로드
      const saved = localStorage.getItem(selectedRestaurantsKey);
      if (saved) {
        setSelectedRestaurants(JSON.parse(saved));
      }
    }
  }, [groupId, token, navigate, selectedRestaurantsKey]);

  // 식당 선택/해제 (끼니별)
  const handleSelectRestaurant = (dayIdx, mealType, restaurant) => {
    const key = `${dayIdx}_${mealType}`; // "0_breakfast", "0_lunch", "0_dinner"

    setSelectedRestaurants((prev) => {
      const newSelected = { ...prev };

      // 해당 끼니에 이미 선택된 식당 배열 가져오기 (새 배열로 복사)
      const currentMealSelections = [...(newSelected[key] || [])];

      // 이미 선택된 식당인지 확인
      const existingIndex = currentMealSelections.findIndex(
        (r) => r.id === restaurant.id
      );

      if (existingIndex >= 0) {
        // 선택 해제 - 불변성 유지
        const updatedSelections = currentMealSelections.filter(
          (_, idx) => idx !== existingIndex
        );
        console.log(
          `❌ 선택 해제: ${dayIdx}일차 ${mealType} - ${restaurant.name}`
        );

        // 배열이 비어있으면 키 삭제, 아니면 업데이트
        if (updatedSelections.length === 0) {
          delete newSelected[key];
        } else {
          newSelected[key] = updatedSelections;
        }
      } else {
        // 선택 추가 (최대 5개)
        if (currentMealSelections.length < 5) {
          const updatedSelections = [...currentMealSelections, restaurant];
          console.log(
            `✅ 선택 추가: ${dayIdx}일차 ${mealType} - ${restaurant.name} (${updatedSelections.length}/5)`
          );
          newSelected[key] = updatedSelections;
        } else {
          alert("끼니당 최대 5개까지만 선택할 수 있습니다.");
          return prev;
        }
      }

      // localStorage 저장
      localStorage.setItem(selectedRestaurantsKey, JSON.stringify(newSelected));
      console.log("💾 저장된 데이터:", newSelected);

      return newSelected;
    });
  };

  // 선택 완료
  const handleComplete = () => {
    console.log("🎉 선택 완료 버튼 클릭");
    console.log("💾 선택된 데이터:", selectedRestaurants);

    // 선택된 항목이 하나라도 있으면 진행 가능
    if (Object.keys(selectedRestaurants).length === 0) {
      alert("최소 하나의 식당을 선택해주세요.");
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

  const currentDayRestaurants = restaurantsByDay[activeDayIndex] || [];

  // 필터링 (별점 + 가격)
  let filteredRestaurants = currentDayRestaurants;

  if (filterRating > 0) {
    filteredRestaurants = filteredRestaurants.filter(
      (r) => r.rating >= filterRating
    );
  }

  if (filterPrice > 0) {
    filteredRestaurants = filteredRestaurants.filter(
      (r) => r.priceLevel === filterPrice
    );
  }

  // 현재 끼니의 선택된 식당들
  const currentMealKey = `${activeDayIndex}_${activeMealType}`;
  const currentMealSelections = selectedRestaurants[currentMealKey] || [];

  const totalDays = Object.keys(restaurantsByDay).length;

  // 선택된 일차 계산 (최소 1개 이상 선택된 일차만 카운트)
  const selectedDaysSet = new Set();
  Object.keys(selectedRestaurants).forEach((key) => {
    const dayIndex = key.split("_")[0];
    const restaurants = selectedRestaurants[key];
    if (Array.isArray(restaurants) && restaurants.length > 0) {
      selectedDaysSet.add(dayIndex);
    }
  });
  const selectedDaysCount = selectedDaysSet.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              식당 선택하기
            </h1>
            <p className="text-gray-600">
              각 끼니별로 최대 5개까지 선택할 수 있습니다
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={handleComplete}>
            선택 완료 ({selectedDaysCount}/{totalDays}일)
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* 일차별 탭 */}
        <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-lg mb-6">
          <div className="flex space-x-2 border-b-2 border-gray-200 pb-2 mb-4 overflow-x-auto">
            {Object.keys(restaurantsByDay)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map((dayIdx) => {
                const idx = parseInt(dayIdx);
                const dayLabel = idx + 1;

                // 해당 일차의 모든 끼니 선택 개수 확인
                const breakfastCount = (
                  selectedRestaurants[`${idx}_breakfast`] || []
                ).length;
                const lunchCount = (selectedRestaurants[`${idx}_lunch`] || [])
                  .length;
                const dinnerCount = (selectedRestaurants[`${idx}_dinner`] || [])
                  .length;
                const totalSelected = breakfastCount + lunchCount + dinnerCount;
                const hasSelection = totalSelected > 0;

                return (
                  <button
                    key={dayIdx}
                    onClick={() => {
                      setActiveDayIndex(idx);
                      setActiveMealType("breakfast"); // 일차 변경 시 자동으로 아침으로 리셋
                    }}
                    className={`px-6 py-3 font-bold transition-all whitespace-nowrap flex items-center gap-2 rounded-lg ${
                      activeDayIndex === idx
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-indigo-50"
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    {dayLabel}일차
                    {hasSelection && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          activeDayIndex === idx
                            ? "bg-white/20"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {totalSelected}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* 끼니 선택 탭 */}
          <div className="flex gap-2">
            {MEAL_TYPES.map((meal) => {
              const MealIcon = meal.icon;
              const mealKey = `${activeDayIndex}_${meal.id}`;
              const mealSelections = selectedRestaurants[mealKey] || [];
              const isActive = activeMealType === meal.id;

              return (
                <button
                  key={meal.id}
                  onClick={() => setActiveMealType(meal.id)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    meal.id === "breakfast"
                      ? isActive
                        ? "border-orange-600 bg-orange-600 shadow-lg"
                        : "border-orange-300 bg-orange-100"
                      : meal.id === "lunch"
                      ? isActive
                        ? "border-yellow-600 bg-yellow-600 shadow-lg"
                        : "border-yellow-300 bg-yellow-100"
                      : isActive
                      ? "border-indigo-600 bg-indigo-600 shadow-lg"
                      : "border-indigo-300 bg-indigo-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MealIcon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-white"
                          : meal.id === "breakfast"
                          ? "text-orange-600"
                          : meal.id === "lunch"
                          ? "text-yellow-600"
                          : "text-indigo-600"
                      }`}
                    />
                    <span
                      className={`font-bold ${
                        isActive
                          ? "text-white"
                          : meal.id === "breakfast"
                          ? "text-orange-600"
                          : meal.id === "lunch"
                          ? "text-yellow-600"
                          : "text-indigo-600"
                      }`}
                    >
                      {meal.label}
                    </span>
                    {mealSelections.length > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-white/30 text-white"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {mealSelections.length}/5
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 현재 날짜 정보 */}
        {group.tripPlan?.days?.[activeDayIndex] && (
          <div className="bg-indigo-50 rounded-lg p-4 mb-6 border-2 border-indigo-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-800">
                {group.tripPlan.days[activeDayIndex].description}
              </span>
              <span className="text-gray-600">
                - {MEAL_TYPES.find((m) => m.id === activeMealType)?.label} 식당
                선택 중
              </span>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-xl p-4 mb-6 border-2 border-indigo-200 shadow-lg">
          <div className="space-y-4">
            {/* 별점 필터 */}
            <div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-gray-800 text-sm">
                  최소 별점:
                </span>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(rating)}
                      className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                        filterRating === rating
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600 font-bold"
                          : "border-gray-300 text-gray-700 hover:border-indigo-400"
                      }`}
                    >
                      {rating === 0 ? "전체" : `⭐ ${rating}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 가격대 필터 */}
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-800 text-sm">
                  가격대:
                </span>
                <div className="flex gap-2">
                  {[
                    { value: 0, label: "전체" },
                    { value: 1, label: "$" },
                    { value: 2, label: "$$" },
                    { value: 3, label: "$$$" },
                    { value: 4, label: "$$$$" },
                  ].map((price) => (
                    <button
                      key={price.value}
                      onClick={() => setFilterPrice(price.value)}
                      className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm font-bold ${
                        filterPrice === price.value
                          ? price.value === 0
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                            : price.value === 1
                            ? "border-green-600 bg-green-50 text-green-600"
                            : price.value === 2
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : price.value === 3
                            ? "border-orange-600 bg-orange-50 text-orange-600"
                            : "border-purple-600 bg-purple-50 text-purple-600"
                          : "border-gray-300 text-gray-700 hover:border-indigo-400"
                      }`}
                    >
                      {price.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 식당 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant, index) => {
            // 현재 끼니 선택 여부
            const isSelectedInCurrentMeal = currentMealSelections.some(
              (r) => r.id === restaurant.id
            );

            // 모든 끼니에서 선택 여부 확인
            const breakfastKey = `${activeDayIndex}_breakfast`;
            const lunchKey = `${activeDayIndex}_lunch`;
            const dinnerKey = `${activeDayIndex}_dinner`;

            const isInBreakfast = (
              selectedRestaurants[breakfastKey] || []
            ).some((r) => r.id === restaurant.id);
            const isInLunch = (selectedRestaurants[lunchKey] || []).some(
              (r) => r.id === restaurant.id
            );
            const isInDinner = (selectedRestaurants[dinnerKey] || []).some(
              (r) => r.id === restaurant.id
            );

            return (
              <div
                key={restaurant.id}
                className={`bg-white rounded-2xl overflow-hidden border-2 shadow-lg transition-all ${
                  isSelectedInCurrentMeal
                    ? "border-green-500 ring-4 ring-green-200"
                    : "border-gray-200 hover:border-indigo-400 hover:shadow-xl"
                }`}
              >
                {/* 이미지 */}
                <div
                  className="relative h-48 cursor-pointer overflow-hidden"
                  onClick={() =>
                    handleSelectRestaurant(
                      activeDayIndex,
                      activeMealType,
                      restaurant
                    )
                  }
                >
                  {restaurant.images[0] ? (
                    <>
                      <img
                        src={restaurant.images[0]}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      {/* 그라데이션 오버레이 - 위쪽이 어둡고 아래가 밝음 */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* 끼니별 선택 체크 - 왼쪽 상단 */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {isInBreakfast && (
                      <div className="bg-orange-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    {isInLunch && (
                      <div className="bg-yellow-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    {isInDinner && (
                      <div className="bg-indigo-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* 끼니 표시 - 이미지 오른쪽 상단 */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {isInBreakfast && (
                      <span className="text-xs font-bold bg-orange-500 text-white px-2 py-1 rounded shadow-lg">
                        아침
                      </span>
                    )}
                    {isInLunch && (
                      <span className="text-xs font-bold bg-yellow-500 text-white px-2 py-1 rounded shadow-lg">
                        점심
                      </span>
                    )}
                    {isInDinner && (
                      <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-1 rounded shadow-lg">
                        저녁
                      </span>
                    )}
                  </div>
                </div>

                {/* 정보 */}
                <div className="p-4">
                  {/* 제목 */}
                  <h3 className="text-lg font-bold text-gray-800 truncate mb-2">
                    {restaurant.name}
                  </h3>

                  {/* 별점 & 가격 정보 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-800">
                        {restaurant.rating || "N/A"}
                      </span>
                      {restaurant.user_ratings_total && (
                        <span className="text-xs text-gray-500">
                          ({restaurant.user_ratings_total})
                        </span>
                      )}
                    </div>
                    {restaurant.priceLevel !== null &&
                      restaurant.priceLevel !== undefined && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600 text-sm">
                              {"$".repeat(restaurant.priceLevel)}
                            </span>
                          </div>
                        </>
                      )}
                  </div>

                  <p className="text-sm text-gray-600 flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {restaurant.location.address}
                    </span>
                  </p>

                  {/* 버튼들 */}
                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          routes.foodDetail
                            .replace(":groupId", groupId)
                            .replace(":restaurantId", restaurant.id)
                        );
                      }}
                      className="w-full"
                    >
                      상세보기
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://www.google.com/maps/place/?q=place_id:${restaurant.id}`,
                            "_blank"
                          );
                        }}
                        className="text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        지도
                      </Button>

                      {restaurant.location?.lat && restaurant.location?.lng && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`,
                              "_blank"
                            );
                          }}
                          className="text-xs"
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          길찾기
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            해당 조건의 식당이 없습니다.
          </div>
        )}
      </main>
    </div>
  );
}

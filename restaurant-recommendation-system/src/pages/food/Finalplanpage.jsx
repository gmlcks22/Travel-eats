import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import {
  Calendar,
  MapPin,
  Star,
  Users,
  Navigation,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Sunrise,
  Sun,
  Sunset,
  DollarSign,
} from "lucide-react";

// 끼니 정보
const MEAL_TYPES = [
  {
    id: "breakfast",
    label: "아침",
    icon: Sunrise,
    color: "bg-orange-500",
    textColor: "text-orange-100",
  },
  {
    id: "lunch",
    label: "점심",
    icon: Sun,
    color: "bg-yellow-500",
    textColor: "text-yellow-100",
  },
  {
    id: "dinner",
    label: "저녁",
    icon: Sunset,
    color: "bg-indigo-500",
    textColor: "text-indigo-100",
  },
];

/**
 * 최종 여행 계획 페이지 - 끼니별 선택 결과 표시
 */
export default function FinalPlanPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [tripDays, setTripDays] = useState([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState({});
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const selectedRestaurantsKey = `selectedRestaurants_${groupId}`;

  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        const groupData = result.group;
        setGroup(groupData);

        const days = groupData.tripPlan?.days || [];
        setTripDays(days);

        // localStorage에서 선택된 식당 로드
        const saved = localStorage.getItem(selectedRestaurantsKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSelectedRestaurants(parsed);

          if (Object.keys(parsed).length === 0) {
            alert("선택된 식당이 없습니다.");
            navigate(routes.foodResult.replace(":groupId", groupId));
          }
        } else {
          alert("선택된 식당이 없습니다.");
          navigate(routes.foodResult.replace(":groupId", groupId));
        }
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, token, navigate, selectedRestaurantsKey]);

  const handleBackToResult = () => {
    navigate(routes.foodResult.replace(":groupId", groupId));
  };

  const handleViewOnGoogleMaps = (placeId) => {
    window.open(
      `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      "_blank"
    );
  };

  const handleGetDirections = (lat, lng) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  if (!group || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  const totalDays = tripDays.length;
  const currentDay = tripDays[activeDayIndex];

  // 통계 계산
  let totalRestaurants = 0;
  let totalRating = 0;
  let ratingCount = 0;

  Object.values(selectedRestaurants).forEach((restaurants) => {
    if (Array.isArray(restaurants)) {
      totalRestaurants += restaurants.length;
      restaurants.forEach((r) => {
        if (r.rating) {
          totalRating += r.rating;
          ratingCount++;
        }
      });
    }
  });

  const avgRating =
    ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <Button
              variant="secondary"
              onClick={() =>
                navigate(routes.groupDetail.replace(":groupId", groupId))
              }
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              그룹으로 돌아가기
            </Button>
            <Button variant="secondary" onClick={handleBackToResult}>
              식당 다시 선택
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                최종 여행 계획
              </h1>
              <p className="text-gray-600">선택한 식당들을 확인하세요</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {totalDays}일
              </div>
              <div className="text-sm text-gray-600">여행 일정</div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">선택한 식당</div>
                <div className="text-3xl font-bold text-green-600">
                  {totalRestaurants}개
                </div>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">그룹 멤버</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {group.members?.length || 0}명
                </div>
              </div>
              <Users className="w-12 h-12 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">평균 별점</div>
                <div className="text-3xl font-bold text-orange-600">
                  ⭐ {avgRating}
                </div>
              </div>
              <Star className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

        {/* 일차별 버튼 */}
        <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            일차 선택
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tripDays.map((day, index) => {
              // 해당 일차의 선택된 끼니 개수
              const breakfastCount = (
                selectedRestaurants[`${index}_breakfast`] || []
              ).length;
              const lunchCount = (selectedRestaurants[`${index}_lunch`] || [])
                .length;
              const dinnerCount = (selectedRestaurants[`${index}_dinner`] || [])
                .length;
              const hasSelection =
                breakfastCount + lunchCount + dinnerCount > 0;

              return (
                <button
                  key={index}
                  onClick={() => setActiveDayIndex(index)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    activeDayIndex === index
                      ? "border-indigo-600 bg-indigo-50 shadow-lg"
                      : "border-gray-300 bg-white hover:border-indigo-400 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-lg font-bold ${
                        activeDayIndex === index
                          ? "text-indigo-600"
                          : "text-gray-700"
                      }`}
                    >
                      {index + 1}일차
                    </span>
                    {hasSelection && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div
                    className={`text-sm ${
                      activeDayIndex === index
                        ? "text-indigo-600"
                        : "text-gray-600"
                    }`}
                  >
                    {day.description}
                  </div>
                  {hasSelection && (
                    <div className="mt-2 text-xs text-gray-600">
                      {breakfastCount > 0 && `🌅 ${breakfastCount}`}
                      {lunchCount > 0 && ` ☀️ ${lunchCount}`}
                      {dinnerCount > 0 && ` 🌆 ${dinnerCount}`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 끼니별 식당 표시 */}
        <div className="space-y-6">
          {MEAL_TYPES.map((meal) => {
            const MealIcon = meal.icon;
            const mealKey = `${activeDayIndex}_${meal.id}`;
            const restaurants = selectedRestaurants[mealKey] || [];

            if (restaurants.length === 0) return null;

            return (
              <div
                key={meal.id}
                className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden"
              >
                {/* 끼니 헤더 */}
                <div className={`${meal.color} px-6 py-4`}>
                  <div className={`flex items-center gap-3 ${meal.textColor}`}>
                    <MealIcon className="w-6 h-6" />
                    <h3 className="text-2xl font-bold text-white">
                      {meal.label}
                    </h3>
                    <span className="text-white/90">
                      ({restaurants.length}개 선택)
                    </span>
                  </div>
                </div>

                {/* 식당 목록 */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurants.map((restaurant, idx) => (
                    <div
                      key={`${restaurant.id}_${idx}`}
                      className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all"
                    >
                      {/* 이미지 */}
                      <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                        {restaurant.images && restaurant.images[0] ? (
                          <img
                            src={restaurant.images[0]}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-sm font-bold">
                            {restaurant.rating || "N/A"}
                          </span>
                        </div>
                        {/* 가격 표시 */}
                        {restaurant.priceLevel !== null &&
                          restaurant.priceLevel !== undefined && (
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span className="text-xs font-bold">
                                {"$".repeat(restaurant.priceLevel)}
                              </span>
                            </div>
                          )}
                      </div>

                      {/* 정보 */}
                      <h4 className="font-bold text-gray-800 mb-2 truncate">
                        {restaurant.name}
                      </h4>

                      {/* 상세 정보 */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="font-semibold">
                              {restaurant.rating || "N/A"}
                            </span>
                            {restaurant.user_ratings_total && (
                              <span>({restaurant.user_ratings_total})</span>
                            )}
                          </div>
                          {/* 가격 정보 */}
                          {restaurant.priceLevel !== null &&
                            restaurant.priceLevel !== undefined && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-green-600" />
                                <span className="font-bold text-green-600">
                                  {"$".repeat(restaurant.priceLevel)}
                                </span>
                              </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 flex items-start gap-1 line-clamp-2">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            {restaurant.location?.address || "주소 정보 없음"}
                          </span>
                        </p>
                      </div>

                      {/* 버튼들 */}
                      <div className="space-y-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            navigate(
                              routes.foodDetail
                                .replace(":groupId", groupId)
                                .replace(":restaurantId", restaurant.id)
                            )
                          }
                          className="w-full text-xs"
                        >
                          상세보기
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleViewOnGoogleMaps(restaurant.id)
                            }
                            className="text-xs"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            지도
                          </Button>
                          {restaurant.location?.lat &&
                            restaurant.location?.lng && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  handleGetDirections(
                                    restaurant.location.lat,
                                    restaurant.location.lng
                                  )
                                }
                                className="text-xs"
                              >
                                <Navigation className="w-3 h-3 mr-1" />
                                길찾기
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 선택된 식당이 하나도 없을 때 */}
          {Object.keys(selectedRestaurants).filter((key) =>
            key.startsWith(`${activeDayIndex}_`)
          ).length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-300">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {activeDayIndex + 1}일차에 선택된 식당이 없습니다.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

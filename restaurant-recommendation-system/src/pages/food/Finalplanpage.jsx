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
} from "lucide-react";

/**
 * 최종 여행 계획 페이지 - 선택된 식당 확인
 */
export default function FinalPlanPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [tripDays, setTripDays] = useState([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState({});
  const [activeDayIndex, setActiveDayIndex] = useState(0); // 현재 보고 있는 일차

  const selectedRestaurantsKey = `selectedRestaurants_${groupId}`;

  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        const groupData = result.group;
        setGroup(groupData);

        const days = groupData.tripPlan?.days || [];
        setTripDays(days);

        console.log("🎯 FinalPlanPage 로드");
        console.log("여행 일수:", days.length);

        // localStorage에서 선택된 식당 로드
        const saved = localStorage.getItem(selectedRestaurantsKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log("💾 선택된 식당:", parsed);
          setSelectedRestaurants(parsed);

          // 모든 날짜가 선택되었는지 확인
          const totalDays = days.length;
          const selectedKeys = Object.keys(parsed);

          const missingDays = [];
          for (let i = 0; i < totalDays; i++) {
            if (!selectedKeys.includes(String(i))) {
              missingDays.push(i + 1);
            }
          }

          if (missingDays.length > 0) {
            alert(
              `아직 모든 날짜의 식당을 선택하지 않았습니다.\n선택되지 않은 날짜: ${missingDays.join(
                ", "
              )}일차`
            );
            navigate(routes.foodResult.replace(":groupId", groupId));
            return;
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
  const currentRestaurant = selectedRestaurants[activeDayIndex];

  // 통계 계산
  const allRestaurants = Object.values(selectedRestaurants);
  const avgRating =
    allRestaurants.length > 0
      ? (
          allRestaurants.reduce((sum, r) => sum + (r.rating || 0), 0) /
          allRestaurants.length
        ).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="secondary"
            onClick={handleBackToResult}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            식당 다시 선택
          </Button>

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
                <div className="text-sm text-gray-600 mb-1">선택 완료</div>
                <div className="text-3xl font-bold text-green-600">
                  {Object.keys(selectedRestaurants).length}/{totalDays}
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
            {tripDays.map((day, index) => (
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
                  {selectedRestaurants[index] && (
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
              </button>
            ))}
          </div>
        </div>

        {/* 선택된 식당 상세 정보 */}
        {currentRestaurant ? (
          <div className="bg-white rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-lg">
            {/* 날짜 헤더 */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <h2 className="text-2xl font-bold">
                      {activeDayIndex + 1}일차
                    </h2>
                    <p className="text-indigo-100 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {currentDay.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="text-xl font-bold">
                    {currentRestaurant.rating || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* 식당 정보 */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 이미지 */}
                <div>
                  {currentRestaurant.images && currentRestaurant.images[0] ? (
                    <img
                      src={currentRestaurant.images[0]}
                      alt={currentRestaurant.name}
                      className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-300">
                      <MapPin className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {currentRestaurant.name}
                    </h3>
                    {currentRestaurant.category && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {currentRestaurant.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">
                      {currentRestaurant.rating || "N/A"}
                    </span>
                    {currentRestaurant.user_ratings_total && (
                      <span className="text-gray-600">
                        ({currentRestaurant.user_ratings_total}개 리뷰)
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-indigo-600" />
                    <span>
                      {currentRestaurant.location?.address || "주소 정보 없음"}
                    </span>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() =>
                        handleViewOnGoogleMaps(currentRestaurant.id)
                      }
                      className="w-full"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Google Maps에서 보기
                    </Button>

                    {currentRestaurant.location?.lat &&
                      currentRestaurant.location?.lng && (
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={() =>
                            handleGetDirections(
                              currentRestaurant.location.lat,
                              currentRestaurant.location.lng
                            )
                          }
                          className="w-full"
                        >
                          <Navigation className="w-5 h-5 mr-2" />
                          길찾기
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-300">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {activeDayIndex + 1}일차에 선택된 식당이 없습니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

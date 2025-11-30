import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { RestaurantCard, InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getCurrentUser, getGroupById, getAllUsers } from "@utils/helpers/storage";
import { Trophy, Filter, MapPin, Star, TrendingUp } from "lucide-react";

/**
 * 추천 결과 페이지
 * - 추천된 식당 목록 표시
 * - 그룹 합의 점수 순으로 정렬
 * - 필터링 기능
 * - 식당 상세 정보로 이동
 */
export default function FoodResultPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [filterScore, setFilterScore] = useState(0);

  // 로그인 체크 - 마운트 시 한 번만
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate(routes.login);
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // 그룹 정보 및 식당 목록 로드
  useEffect(() => {
    if (!currentUser || !groupId) return;

    const groupData = getGroupById(groupId);
    if (!groupData) {
      alert("존재하지 않는 그룹입니다.");
      navigate(routes.home);
      return;
    }

    if (!groupData.restaurants || groupData.restaurants.length === 0) {
      alert("아직 추천 결과가 없습니다.");
      navigate(routes.groupDetail.replace(":groupId", groupId));
      return;
    }

    setGroup(groupData);
    setRestaurants(groupData.restaurants);
    setFilteredRestaurants(groupData.restaurants);
  }, [currentUser, groupId, navigate]);

  // 필터링 처리
  useEffect(() => {
    if (filterScore === 0) {
      setFilteredRestaurants(restaurants);
    } else {
      setFilteredRestaurants(
        restaurants.filter(r => r.consensus.totalScore >= filterScore)
      );
    }
  }, [filterScore, restaurants]);

  // 식당 상세 페이지로 이동
  const handleRestaurantClick = (restaurant) => {
    navigate(
      routes.foodDetail
        .replace(":groupId", groupId)
        .replace(":restaurantId", restaurant.id)
    );
  };

  if (!currentUser || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  const topRestaurant = filteredRestaurants[0];
  const avgScore = filteredRestaurants.length > 0
    ? Math.round(
        filteredRestaurants.reduce((sum, r) => sum + r.consensus.totalScore, 0) /
        filteredRestaurants.length
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎉 추천 식당 결과
          </h1>
          <p className="text-gray-600">
            {group.name} · {group.tripPlan.region} · {group.tripPlan.days}일 여행
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <InfoCard
            title="추천 식당"
            value={`${filteredRestaurants.length}개`}
            icon={<MapPin />}
            color="indigo"
          />
          <InfoCard
            title="평균 합의점수"
            value={`${avgScore}점`}
            icon={<Star />}
            color="green"
          />
          <InfoCard
            title="최고 점수"
            value={topRestaurant ? `${topRestaurant.consensus.totalScore}점` : "-"}
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
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800">필터</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    최소 합의 점수
                  </label>
                  <select
                    value={filterScore}
                    onChange={(e) => setFilterScore(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={0}>전체 보기</option>
                    <option value={80}>80점 이상 (매우 좋음)</option>
                    <option value={70}>70점 이상 (좋음)</option>
                    <option value={60}>60점 이상 (보통 이상)</option>
                    <option value={50}>50점 이상</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    현재 {filteredRestaurants.length}개의 식당이 표시되고 있습니다.
                  </p>
                </div>
              </div>

              {/* 안내 */}
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs text-indigo-800">
                  💡 <strong>합의 점수란?</strong>
                  <br />
                  모든 멤버의 선호도를 종합하여 계산한 점수입니다. 높을수록 그룹 전체가 만족할 가능성이 높습니다!
                </p>
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
                {filteredRestaurants.map((restaurant, index) => (
                  <div key={restaurant.id} className="relative">
                    {/* 순위 뱃지 */}
                    {index < 3 && (
                      <div className="absolute -left-3 -top-3 z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : "bg-orange-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>
                    )}
                    <RestaurantCard
                      restaurant={restaurant}
                      consensus={restaurant.consensus}
                      onClick={() => handleRestaurantClick(restaurant)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate(routes.groupDetail.replace(":groupId", groupId))}
          >
            그룹으로 돌아가기
          </Button>
        </div>
      </main>
    </div>
  );
}
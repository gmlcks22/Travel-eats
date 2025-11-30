import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { getCurrentUser, getGroupById, getAllUsers } from "@utils/helpers/storage";
import { MapPin, Star, DollarSign, Users, ThumbsUp, ThumbsDown } from "lucide-react";

/**
 * 식당 상세 정보 페이지
 * - 식당 기본 정보
 * - 그룹 합의 분석
 * - 멤버별 선호도 확인
 * - 지도 표시 (간단한 표시)
 */
export default function FoodDetailPage() {
  const navigate = useNavigate();
  const { groupId, restaurantId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 통합된 데이터 로드
  useEffect(() => {
    const user = getCurrentUser();
    
    // 로그인 체크
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate(routes.login);
      return;
    }

    setCurrentUser(user);

    // 그룹 체크
    const groupData = getGroupById(groupId);
    if (!groupData) {
      alert("존재하지 않는 그룹입니다.");
      navigate(routes.home);
      return;
    }

    // 식당 데이터 체크
    const restaurantData = groupData.restaurants?.find(r => r.id === restaurantId);
    if (!restaurantData) {
      alert("식당 정보를 찾을 수 없습니다.");
      navigate(routes.foodResult.replace(":groupId", groupId));
      return;
    }

    setGroup(groupData);
    setRestaurant(restaurantData);

    // 멤버 정보 로드
    const allUsers = getAllUsers();
    const memberData = groupData.members.map(memberId => 
      allUsers.find(u => u.id === memberId)
    ).filter(Boolean);
    setMembers(memberData);
    
    setIsLoading(false);
  }, [groupId, restaurantId, navigate]);

  if (isLoading || !restaurant || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  const { consensus } = restaurant;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* 식당 기본 정보 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 왼쪽: 이미지 */}
              <div>
                <div className="w-full h-64 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center overflow-hidden">
                  {restaurant.images && restaurant.images[0] ? (
                    <img 
                      src={restaurant.images[0]} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-8xl">🍽️</span>
                  )}
                </div>
              </div>

              {/* 오른쪽: 정보 */}
              <div>
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {restaurant.name}
                  </h1>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium">
                      {restaurant.category}
                    </span>
                    {restaurant.keywords?.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span>평점: <strong>{restaurant.rating}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span>평균 가격: <strong>{restaurant.avgPrice?.toLocaleString()}원</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <span>{restaurant.location?.address}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">그룹 합의 점수</span>
                    <span className="text-3xl font-bold text-indigo-600">
                      {consensus.totalScore}점
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 설명 */}
            {restaurant.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700">{restaurant.description}</p>
              </div>
            )}
          </div>

          {/* 그룹 합의 분석 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              멤버별 선호도 분석
            </h2>

            <div className="space-y-4">
              {/* 좋아하는 멤버 */}
              {consensus.likedMembers.length > 0 && (
                <div className="p-5 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-green-800">
                      이 식당을 좋아할 멤버 ({consensus.likedMembers.length}명)
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {consensus.likedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="px-4 py-2 bg-white rounded-lg border border-green-300 text-green-700 font-medium"
                      >
                        {member.nickname}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 싫어하는 멤버 */}
              {consensus.dislikedMembers.length > 0 && (
                <div className="p-5 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-red-800">
                      선호하지 않을 수 있는 멤버 ({consensus.dislikedMembers.length}명)
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {consensus.dislikedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="px-4 py-2 bg-white rounded-lg border border-red-300 text-red-700 font-medium"
                      >
                        {member.nickname}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 중립 멤버 */}
              {(() => {
                const neutralMembers = members.filter(
                  m => !consensus.likedMembers.find(lm => lm.id === m.id) &&
                       !consensus.dislikedMembers.find(dm => dm.id === m.id)
                );
                return neutralMembers.length > 0 && (
                  <div className="p-5 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h3 className="font-bold text-gray-800">
                        무난하게 받아들일 멤버 ({neutralMembers.length}명)
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {neutralMembers.map((member) => (
                        <div
                          key={member.id}
                          className="px-4 py-2 bg-white rounded-lg border border-gray-300 text-gray-700 font-medium"
                        >
                          {member.nickname}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 지도 (간단한 위치 표시) */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-7 h-7 text-red-600" />
              위치 정보
            </h2>
            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-red-600 mx-auto mb-2" />
                <p className="text-gray-600">{restaurant.location?.address}</p>
                <p className="text-sm text-gray-500 mt-1">
                  위도: {restaurant.location?.lat?.toFixed(4)}, 
                  경도: {restaurant.location?.lng?.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate(routes.foodResult.replace(":groupId", groupId))}
            >
              목록으로
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
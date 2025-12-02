import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import {
  Users,
  MapPin,
  Calendar,
  Copy,
  Check,
  Settings,
  Heart,
  ThumbsDown,
  Utensils,
} from "lucide-react";

const COLOR_MAP = {
  indigo: {
    bg: "bg-indigo-600",
    ring: "ring-indigo-500",
    bgLight: "bg-indigo-50",
  },
  red: { bg: "bg-red-500", ring: "ring-red-500", bgLight: "bg-red-50" },
  green: { bg: "bg-green-500", ring: "ring-green-500", bgLight: "bg-green-50" },
  blue: { bg: "bg-blue-500", ring: "ring-blue-500", bgLight: "bg-blue-50" },
  yellow: {
    bg: "bg-yellow-500",
    ring: "ring-yellow-500",
    bgLight: "bg-yellow-50",
  },
  purple: {
    bg: "bg-purple-600",
    ring: "ring-purple-500",
    bgLight: "bg-purple-50",
  },
  pink: { bg: "bg-pink-500", ring: "ring-pink-500", bgLight: "bg-pink-50" },
};

/**
 * 그룹 선호도 합의 계산 함수 (맛/재료 제거)
 */
const calculateGroupConsensus = (members) => {
  const allLikedCategories = [];
  const allDislikedCategories = [];

  members.forEach((member) => {
    if (member.preference) {
      if (member.preference.likedCategories) {
        allLikedCategories.push(...member.preference.likedCategories);
      }
      if (member.preference.dislikedCategories) {
        allDislikedCategories.push(...member.preference.dislikedCategories);
      }
    }
  });

  const uniqueLikedCategories = [...new Set(allLikedCategories)];
  const finalLikedCategories = uniqueLikedCategories.filter(
    (cat) => !allDislikedCategories.includes(cat)
  );

  const finalDislikedCategories = [...new Set(allDislikedCategories)];

  return {
    likedCategories: finalLikedCategories,
    dislikedCategories: finalDislikedCategories,
  };
};

/**
 * 그룹 상세 페이지
 */
export default function GroupDetailPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);

      if (result.success) {
        setGroup(result.group);
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, token, navigate]);

  const handleCopyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartPlanning = () => {
    navigate(routes.tripPlan.replace(":groupId", groupId));
  };

  const handleViewResults = () => {
    navigate(routes.foodResult.replace(":groupId", groupId));
  };

  const handleViewFinalPlan = () => {
    navigate(routes.finalPlan.replace(":groupId", groupId));
  };

  if (!group || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  const membersWithoutPreference = group.members.filter(
    (member) => !member.preference
  );

  const handleRequestRecommendation = () => {
    if (membersWithoutPreference.length > 0) {
      const memberNames = membersWithoutPreference
        .map((m) => m.nickname)
        .join(", ");
      alert(
        `아직 다음 멤버들이 선호도 조사를 완료하지 않았습니다: ${memberNames}`
      );
      return;
    }

    const targetPath = routes.loading
      .replace(":groupId", groupId)
      .replace(":dayIndex", "all");

    navigate(targetPath);
  };

  const isCreator = group.creatorId === session.user.id;
  const hasRestaurants =
    group.restaurantsByDay ||
    (group.restaurants && group.restaurants.length > 0);

  const selectedRestaurantsKey = `selectedRestaurants_${groupId}`;
  const selectedRestaurants = JSON.parse(
    localStorage.getItem(selectedRestaurantsKey) || "{}"
  );

  const totalTripDays = group.tripPlan?.days?.length || 0;

  const selectedDaysSet = new Set();
  Object.keys(selectedRestaurants).forEach((key) => {
    const dayIndex = key.split("_")[0];
    const restaurants = selectedRestaurants[key];
    if (Array.isArray(restaurants) && restaurants.length > 0) {
      selectedDaysSet.add(dayIndex);
    }
  });
  const selectedDaysCount = selectedDaysSet.size;

  const allDaysSelected =
    totalTripDays > 0 && selectedDaysCount === totalTripDays;

  const groupConsensus = calculateGroupConsensus(group.members);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* 그룹 헤더 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {group.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-mono font-bold">
                  {group.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className={`p-2 rounded-lg transition-colors ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                  }`}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {copied && (
                  <span className="text-sm text-green-600">복사됨!</span>
                )}
              </div>
            </div>
            {isCreator && (
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(routes.groupManage.replace(":groupId", groupId))
                }
              >
                <Settings className="w-5 h-5" />
                그룹 관리
              </Button>
            )}
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InfoCard
              title="멤버 수"
              value={`${group.members.length}명`}
              icon={<Users />}
              color="indigo"
            />
            {group.tripPlan?.days ? (
              <>
                <InfoCard
                  title="첫날 여행지"
                  value={group.tripPlan.days[0]?.description || "미설정"}
                  icon={<MapPin />}
                  color="green"
                />
                <InfoCard
                  title="여행 기간"
                  value={`${
                    Array.isArray(group.tripPlan.days)
                      ? group.tripPlan.days.length
                      : 0
                  }일`}
                  icon={<Calendar />}
                  color="purple"
                />
                <InfoCard
                  title="선택한 일차"
                  value={`${selectedDaysCount}/${totalTripDays}일`}
                  icon={<Utensils />}
                  color={allDaysSelected ? "green" : "orange"}
                />
              </>
            ) : (
              <div className="col-span-3 flex items-center justify-center bg-yellow-50 rounded-lg shadow-md p-4">
                <p className="text-yellow-800">
                  아직 여행 계획이 설정되지 않았습니다
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 멤버 목록 + 그룹 선호도 합의 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 멤버 목록 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                그룹 멤버
              </h2>
              <div className="space-y-3">
                {group.members.map((member) => {
                  const color = member.avatarColor || "indigo";

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 ${COLOR_MAP[color].bgLight} rounded-lg shadow-md`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${COLOR_MAP[color].bg} text-white rounded-full flex items-center justify-center font-bold`}
                        >
                          {member.nickname[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">
                              {member.nickname}
                            </p>
                            {!member.preference && (
                              <span className="text-xs text-orange-500 font-semibold">
                                (선호도 미설정)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">@{member.id}</p>
                        </div>
                      </div>
                      {member.id === group.creatorId && (
                        <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded">
                          그룹장
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 그룹 선호도 합의 (맛/재료 제거) */}
            {membersWithoutPreference.length === 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-indigo-600" />
                  그룹 선호도 합의
                </h2>
                <div className="space-y-4">
                  {groupConsensus.likedCategories.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg shadow-md">
                      <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        좋아하는 음식 종류
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {groupConsensus.likedCategories.map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        ✅ 모두가 좋아하는 음식 (선호하지 않는 멤버가 있으면
                        제외됨)
                      </p>
                    </div>
                  )}

                  {groupConsensus.dislikedCategories.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg shadow-md">
                      <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                        <ThumbsDown className="w-5 h-5" />
                        선호하지 않는 음식 종류
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {groupConsensus.dislikedCategories.map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ 한 명이라도 선호하지 않으면 추천에서 제외됩니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 액션 버튼 */}
          <div className="space-y-4">
            {!group.tripPlan?.days ? (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-3">다음 단계</h3>
                <p className="text-sm text-gray-600 mb-4">
                  여행 계획을 설정하고 멤버들의 음식 선호도를 입력하세요.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartPlanning}
                  className="w-full"
                >
                  여행 계획 시작하기
                </Button>
              </div>
            ) : (
              <>
                {/* 식당 추천 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-gray-800 mb-3">식당 추천</h3>
                  {hasRestaurants ? (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        추천 식당 목록에서 원하는 식당을 선택하세요
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleViewResults}
                          className="w-full"
                        >
                          <Utensils className="w-5 h-5" />
                          식당 선택하기
                        </Button>

                        {selectedDaysCount > 0 && (
                          <Button
                            variant="secondary"
                            size="lg"
                            onClick={() =>
                              navigate(
                                routes.finalPlan.replace(":groupId", groupId)
                              )
                            }
                            className="w-full"
                          >
                            최종 계획 보기 ({selectedDaysCount}/{totalTripDays}
                            일)
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        모든 멤버의 선호도를 바탕으로 식당을 추천받으세요
                      </p>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleRequestRecommendation}
                        className="w-full"
                        disabled={membersWithoutPreference.length > 0}
                      >
                        식당 추천 받기
                      </Button>
                      {membersWithoutPreference.length > 0 && (
                        <p className="text-xs text-orange-600 mt-2">
                          모든 멤버가 선호도를 입력해야 합니다
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* 최종 계획 */}
                {allDaysSelected && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="font-bold text-gray-800 mb-3">
                      ✅ 계획 완료
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      모든 날짜의 식당을 선택했습니다!
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleViewFinalPlan}
                      className="w-full"
                    >
                      최종 계획 보기
                    </Button>
                  </div>
                )}

                {/* 여행 계획 수정 */}
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(routes.tripPlan.replace(":groupId", groupId))
                    }
                    className="w-full"
                  >
                    여행 계획 수정
                  </Button>
                </div>
              </>
            )}

            {/* 안내 */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200 shadow-lg shadow-indigo-200">
              <p className="text-sm text-gray-700">
                💡 <strong>팁:</strong>
                <br />
                • 그룹 코드를 친구들에게 공유하세요
                <br />
                • 모든 멤버의 선호도가 중요합니다
                <br />• 여행 전에 미리 계획을 세우세요
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

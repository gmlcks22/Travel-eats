import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { GroupCard, InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getCurrentUser, getUserGroups } from "@utils/helpers/storage";
import { User, Users, Settings, Heart } from "lucide-react";

/**
 * 마이페이지
 * - 사용자 정보 표시
 * - 참여 중인 그룹 목록
 * - 선호도 수정 링크
 * - 개인정보 수정 링크
 */
export default function MyPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [userGroups, setUserGroups] = useState([]);

  // 로그인 체크 및 그룹 목록 로드
  useEffect(() => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      navigate(routes.login);
      return;
    }

    const groups = getUserGroups(currentUser.id);
    setUserGroups(groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 그룹 상세로 이동
  const handleGroupClick = (group) => {
    navigate(routes.groupDetail.replace(":groupId", group.id));
  };

  // 선호도 수정 (독립적인 페이지로 이동)
  const handleEditPreference = () => {
    navigate(routes.preferenceEdit);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* 프로필 헤더 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-4xl font-bold">
                  {currentUser.nickname[0]}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {currentUser.nickname}
                  </h1>
                  <p className="text-gray-600">@{currentUser.id}</p>
                  <p className="text-sm text-indigo-600 mt-1">
                    PID: {currentUser.pid}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(routes.mypageEdit)}
                className="flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                정보 수정
              </Button>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <InfoCard
              title="참여 그룹"
              value={`${userGroups.length}개`}
              icon={<Users />}
              color="indigo"
            />
            <InfoCard
              title="선호도 설정"
              value={currentUser.preference ? "완료" : "미설정"}
              icon={<Heart />}
              color={currentUser.preference ? "green" : "orange"}
            />
            <InfoCard
              title="가입일"
              value={new Date(currentUser.createdAt).toLocaleDateString()}
              icon={<User />}
              color="purple"
            />
          </div>

          {/* 선호도 정보 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-7 h-7 text-indigo-600" />
                음식 선호도
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEditPreference}
              >
                수정하기
              </Button>
            </div>

            {currentUser.preference ? (
              <div className="space-y-4">
                {/* 좋아하는 카테고리 */}
                {currentUser.preference.likedCategories?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">좋아하는 음식 종류</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.preference.likedCategories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 싫어하는 카테고리 */}
                {currentUser.preference.dislikedCategories?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">선호하지 않는 음식 종류</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.preference.dislikedCategories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 못 먹는 음식 */}
                {currentUser.preference.cannotEat?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">못 먹는 음식</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.preference.cannotEat.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 예산 범위 */}
                {currentUser.preference.budgetRange && (
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">선호 가격대</h3>
                    <p className="text-gray-600">
                      {currentUser.preference.budgetRange[0].toLocaleString()}원 ~ {currentUser.preference.budgetRange[1].toLocaleString()}원
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">아직 선호도를 설정하지 않았습니다.</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleEditPreference}
                >
                  지금 설정하기
                </Button>
              </div>
            )}
          </div>

          {/* 참여 그룹 목록 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              참여 중인 그룹
            </h2>

            {userGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">참여 중인 그룹이 없습니다.</p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(routes.groupCreate)}
                  >
                    그룹 만들기
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate(routes.groupJoin)}
                  >
                    그룹 참여하기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onClick={() => handleGroupClick(group)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
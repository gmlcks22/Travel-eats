import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { GroupCard, InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getUserGroups, leaveGroup, deleteGroup } from "@utils/helpers/storage";
import { User, Users, Settings, Heart, LogOut } from "lucide-react";

/**
 * 마이페이지 (맛/재료 선호도 제거)
 */
export default function MyPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState([]);

  const fetchGroups = useCallback(() => {
    if (token) {
      const result = getUserGroups(token);
      if (result.success) {
        setUserGroups(result.groups);
      } else {
        console.error(result.message);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleNavigate = (groupId) => {
    navigate(routes.groupDetail.replace(":groupId", groupId));
  };

  const handleLeave = (groupId) => {
    if (window.confirm("정말로 그룹에서 나가시겠습니까?")) {
      const result = leaveGroup(token, groupId);
      alert(result.message);
      if (result.success) {
        fetchGroups();
      }
    }
  };

  const handleDelete = (groupId) => {
    if (
      window.confirm(
        "그룹을 삭제하면 모든 데이터가 사라집니다. 정말로 삭제하시겠습니까?"
      )
    ) {
      const result = deleteGroup(token, groupId);
      alert(result.message);
      if (result.success) {
        fetchGroups();
      }
    }
  };

  const handleEditPreference = () => {
    navigate(routes.onboardingPreference, {
      state: { returnTo: routes.mypage },
    });
  };

  const onLogoutClick = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      handleLogout();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  const { user } = session;

  const COLOR_MAP = {
    indigo: "bg-indigo-600",
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-600",
    pink: "bg-pink-500",
  };
  const avatarColorName = user.avatarColor || "indigo";
  const avatarColorClass = COLOR_MAP[avatarColorName] || COLOR_MAP.indigo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* 2단 레이아웃 섹션 */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-6 mb-6">
            {/* 왼쪽 컬럼 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 프로필 헤더 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-24 h-24 ${avatarColorClass} text-white rounded-full flex items-center justify-center text-4xl font-bold`}
                    >
                      {user.nickname[0]}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {user.nickname}
                      </h1>
                      <p className="text-gray-600">@{user.id}</p>
                      <p className="text-sm text-indigo-600 mt-1">
                        PID: {user.pid}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate(routes.mypageEdit)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    정보 수정
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={onLogoutClick}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    로그아웃
                  </Button>
                </div>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
                <InfoCard
                  title="참여 그룹"
                  value={`${userGroups.length}개`}
                  icon={<Users />}
                  color="indigo"
                />
                <InfoCard
                  title="선호도 설정"
                  value={user.preference ? "완료" : "미설정"}
                  icon={<Heart />}
                  color={user.preference ? "green" : "orange"}
                />
                <InfoCard
                  title="가입일"
                  value={new Date(user.createdAt).toLocaleDateString()}
                  icon={<User />}
                  color="purple"
                />
              </div>
            </div>

            {/* 오른쪽 컬럼 - 선호도 정보 (맛/재료 제거) */}
            <div className="lg:col-span-2 mt-6 lg:mt-0">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
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
                    {user.preference ? "수정하기" : "설정하기"}
                  </Button>
                </div>
                {user.preference ? (
                  <div className="space-y-4">
                    {user.preference.likedCategories?.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg shadow-md">
                        <h3 className="font-bold text-green-800 mb-2">
                          좋아하는 음식 종류
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {user.preference.likedCategories.map((cat) => (
                            <span
                              key={cat}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.preference.dislikedCategories?.length > 0 && (
                      <div className="p-4 bg-yellow-50 rounded-lg shadow-md">
                        <h3 className="font-bold text-yellow-800 mb-2">
                          선호하지 않는 음식 종류
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {user.preference.dislikedCategories.map((cat) => (
                            <span
                              key={cat}
                              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      아직 선호도를 설정하지 않았습니다.
                    </p>
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
            </div>
          </div>

          {/* 전체 너비 섹션 - 참여 중인 그룹 */}
          <div className="bg-indigo-50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-7 h-7 text-indigo-600" />
                참여 중인 그룹
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(routes.myGroups)}
              >
                전체 보기
              </Button>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {userGroups.slice(0, 4).map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    session={session}
                    onClick={() => handleNavigate(group.id)}
                    onLeave={handleLeave}
                    onDelete={handleDelete}
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

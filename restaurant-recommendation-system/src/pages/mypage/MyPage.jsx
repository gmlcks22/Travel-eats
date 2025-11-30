import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { GroupCard, InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getUserGroups } from "@utils/helpers/storage";
import { User, Users, Settings, Heart } from "lucide-react";

/**
 * 마이페이지
 * - 사용자 정보 표시
 * - 참여 중인 그룹 목록
 * - 선호도 수정 링크
 * - 개인정보 수정 링크
 */
export default function MyPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState([]);

  // 그룹 목록 로드
  useEffect(() => {
    // 세션과 토큰이 유효한지 확인
    if (token) {
      const result = getUserGroups(token);
      if (result.success) {
        setUserGroups(result.groups);
      } else {
        // 토큰이 유효하지 않은 경우, App.jsx의 보호 라우트가 처리하므로
        // 여기서는 에러 로깅 또는 UI 피드백만 처리할 수 있습니다.
        console.error(result.message);
      }
    }
  }, [token]);

  // 그룹 상세로 이동
  const handleGroupClick = (group) => {
    navigate(routes.groupDetail.replace(":groupId", group.id));
  };

  // 선호도 수정 (첫 번째 그룹 기준)
  const handleEditPreference = () => {
    if (userGroups.length > 0) {
      navigate(routes.foodPreference.replace(":groupId", userGroups[0].id));
    } else {
      alert("먼저 그룹에 참여해주세요.");
    }
  };

  // ProtectedRoute가 렌더링을 막아주므로, session이 없을 경우를 대비한 null 반환은 불필요.
  // 다만, 데이터가 로드되기 전의 로딩 상태를 고려할 수 있습니다.
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* 프로필 헤더 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-4xl font-bold">
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

            {user.preference ? (
              <div className="space-y-4">
                {user.preference.likedCategories?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">좋아하는 음식 종류</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.preference.likedCategories.map((cat, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
                {user.preference.dislikedCategories?.length > 0 && (
                   <div>
                     <h3 className="font-bold text-gray-700 mb-2">선호하지 않는 음식 종류</h3>
                     <div className="flex flex-wrap gap-2">
                       {user.preference.dislikedCategories.map((cat, idx) => (
                         <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm">{cat}</span>
                       ))}
                     </div>
                   </div>
                )}
                {user.preference.cannotEat?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">못 먹는 음식</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.preference.cannotEat.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                {user.preference.budgetRange && (
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">선호 가격대</h3>
                    <p className="text-gray-600">
                      {user.preference.budgetRange[0].toLocaleString()}원 ~ {user.preference.budgetRange[1].toLocaleString()}원
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">아직 선호도를 설정하지 않았습니다.</p>
                <Button variant="primary" size="md" onClick={handleEditPreference}>
                  지금 설정하기
                </Button>
              </div>
            )}
          </div>

          {/* 참여 그룹 목록 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
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
                  <Button variant="primary" size="md" onClick={() => navigate(routes.groupCreate)}>
                    그룹 만들기
                  </Button>
                  <Button variant="secondary" size="md" onClick={() => navigate(routes.groupJoin)}>
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

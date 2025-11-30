import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { GroupCard, InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getUserGroups, leaveGroup, deleteGroup } from "@utils/helpers/storage";
import { User, Users, Settings, Heart } from "lucide-react";

/**
 * 마이페이지
 * - 사용자 정보 표시
 * - 참여 중인 그룹 목록 (나가기/삭제 기능 포함)
 */
export default function MyPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState([]);

  // 그룹 목록 로드 (컴포넌트 마운트 및 그룹 변경 시 새로고침을 위해 useCallback 사용)
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

  // 그룹 상세로 이동
  const handleNavigate = (groupId) => {
    navigate(routes.groupDetail.replace(":groupId", groupId));
  };
  
  const handleLeave = (groupId) => {
    if (window.confirm("정말로 그룹에서 나가시겠습니까?")) {
      const result = leaveGroup(token, groupId);
      alert(result.message);
      if(result.success) {
        fetchGroups(); // 목록 새로고침
      }
    }
  };

  const handleDelete = (groupId) => {
    if (window.confirm("그룹을 삭제하면 모든 데이터가 사라집니다. 정말로 삭제하시겠습니까?")) {
      const result = deleteGroup(token, groupId);
      alert(result.message);
      if(result.success) {
        fetchGroups(); // 목록 새로고침
      }
    }
  };

  // 선호도 수정 (첫 번째 그룹 기준)
  const handleEditPreference = () => {
    if (userGroups.length > 0) {
      // BUG FIX: routes.foodPreference -> routes.groupFoodPreference
      navigate(routes.groupFoodPreference.replace(":groupId", userGroups[0].id));
    } else {
      // 그룹이 없으면 온보딩 선호도 설정 페이지로 보낼 수 있음
      navigate(routes.onboardingPreference);
    }
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

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
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.nickname}</h1>
                  <p className="text-gray-600">@{user.id}</p>
                  <p className="text-sm text-indigo-600 mt-1">PID: {user.pid}</p>
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
            <InfoCard title="참여 그룹" value={`${userGroups.length}개`} icon={<Users />} color="indigo" />
            <InfoCard title="선호도 설정" value={user.preference ? "완료" : "미설정"} icon={<Heart />} color={user.preference ? "green" : "orange"} />
            <InfoCard title="가입일" value={new Date(user.createdAt).toLocaleDateString()} icon={<User />} color="purple" />
          </div>

          {/* 선호도 정보 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Heart className="w-7 h-7 text-indigo-600" />음식 선호도</h2>
              <Button variant="secondary" size="sm" onClick={handleEditPreference}>수정하기</Button>
            </div>
            {user.preference ? (
              <div className="space-y-4">
                {/* ... (preference display logic remains the same) ... */}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">아직 선호도를 설정하지 않았습니다.</p>
                <Button variant="primary" size="md" onClick={handleEditPreference}>지금 설정하기</Button>
              </div>
            )}
          </div>

          {/* 참여 그룹 목록 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="w-7 h-7 text-indigo-600" />참여 중인 그룹</h2>
              <Button variant="secondary" size="sm" onClick={() => navigate(routes.myGroups)}>전체 보기</Button>
            </div>
            {userGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">참여 중인 그룹이 없습니다.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="primary" size="md" onClick={() => navigate(routes.groupCreate)}>그룹 만들기</Button>
                  <Button variant="secondary" size="md" onClick={() => navigate(routes.groupJoin)}>그룹 참여하기</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGroups.slice(0, 4).map((group) => ( // Show up to 4 groups
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

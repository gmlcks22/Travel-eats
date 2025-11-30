import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { GroupCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getUserGroups, leaveGroup, deleteGroup } from "@utils/helpers/storage";
import { Users, Plus } from "lucide-react";

/**
 * 내가 참여한 그룹 목록 페이지 (나가기/삭제 기능 추가)
 */
export default function MyGroupsPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(() => {
    if (token) {
      const result = getUserGroups(token);
      if (result.success) {
        setGroups(result.groups);
      } else {
        alert(result.message);
        navigate(routes.login);
      }
      setLoading(false);
    }
  }, [token, navigate]);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">나의 그룹</h1>
            <p className="text-gray-600">내가 참여하고 있는 모든 그룹 목록입니다.</p>
          </div>
          <Button variant="primary" onClick={() => navigate(routes.groupCreate)}>
            <Plus className="w-5 h-5 mr-2" />새 그룹 만들기
          </Button>
        </div>

        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
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
        ) : (
          <div className="text-center bg-white rounded-2xl p-12 border-2 border-dashed border-gray-300">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">아직 참여한 그룹이 없어요</h2>
            <p className="text-gray-500 mb-6">
              새로운 그룹을 만들거나, 초대 코드로 그룹에 참여해보세요!
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={() => navigate(routes.groupCreate)}>
                <Plus className="w-5 h-5 mr-2" />새 그룹 만들기
              </Button>
              <Button variant="secondary" onClick={() => navigate(routes.groupJoin)}>
                초대 코드로 참여
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={() => navigate(routes.mypage)}>마이페이지로 돌아가기</Button>
        </div>
      </main>
    </div>
  );
}

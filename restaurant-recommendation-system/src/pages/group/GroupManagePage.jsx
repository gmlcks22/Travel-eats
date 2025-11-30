import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { getGroupById, updateGroup, deleteGroup, removeUserFromGroup } from "@utils/helpers/storage";
import { UserX, Trash2, ShieldCheck, Save } from "lucide-react";

/**
 * 그룹 관리 페이지 (그룹 생성자 전용)
 */
export default function GroupManagePage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  const fetchGroup = () => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        setGroup(result.group);
        setGroupName(result.group.name);
      } else {
        alert(result.message);
        navigate(routes.home);
      }
      setLoading(false);
    }
  };

  useEffect(fetchGroup, [groupId, token, navigate]);

  // 그룹 이름 변경
  const handleUpdateName = (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert("그룹 이름을 입력해주세요.");
      return;
    }
    const result = updateGroup(token, groupId, { name: groupName.trim() });
    if (result.success) {
      alert("그룹 이름이 변경되었습니다.");
      fetchGroup(); // 데이터 새로고침
    } else {
      alert(result.message);
    }
  };

  // 멤버 내보내기
  const handleRemoveMember = (userIdToRemove) => {
    if (window.confirm("정말로 이 멤버를 내보내시겠습니까?")) {
      const result = removeUserFromGroup(token, groupId, userIdToRemove);
      alert(result.message);
      if (result.success) {
        fetchGroup();
      }
    }
  };

  // 그룹 삭제
  const handleDeleteGroup = () => {
    if (window.confirm("경고: 그룹을 삭제하면 모든 관련 데이터가 사라집니다. 정말로 삭제하시겠습니까?")) {
      const result = deleteGroup(token, groupId);
      alert(result.message);
      if (result.success) {
        navigate(routes.home);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  // 생성자 권한 확인
  if (!session || !group || session.user.id !== group.creatorId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <h1 className="text-2xl font-bold text-red-700 mb-4">접근 권한 없음</h1>
        <p className="text-gray-600">그룹 생성자만 이 페이지에 접근할 수 있습니다.</p>
        <Button onClick={() => navigate(routes.home)} className="mt-6">홈으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">그룹 관리</h1>
          <p className="text-gray-600 mb-8">그룹 이름 변경, 멤버 관리 및 그룹 삭제를 할 수 있습니다.</p>

          {/* 그룹 이름 변경 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">그룹 이름 변경</h2>
            <form onSubmit={handleUpdateName} className="flex gap-3">
              <Input
                type="text"
                value={groupName}
                onChange={setGroupName}
                placeholder="새로운 그룹 이름"
                className="flex-grow"
              />
              <Button type="submit"><Save className="w-5 h-5 mr-2" />저장</Button>
            </form>
          </div>

          {/* 멤버 관리 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">멤버 관리</h2>
            <ul className="space-y-3">
              {group.members.map(member => (
                <li key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-bold">{member.nickname}</span>
                    <span className="text-sm text-gray-500 ml-2">@{member.id}</span>
                  </div>
                  {member.id === group.creatorId ? (
                    <div className="flex items-center gap-1 text-sm text-indigo-600 px-2 py-1 bg-indigo-100 rounded">
                      <ShieldCheck className="w-4 h-4" />
                      <span>그룹장</span>
                    </div>
                  ) : (
                    <Button variant="danger" size="sm" onClick={() => handleRemoveMember(member.id)}>
                      <UserX className="w-4 h-4 mr-1" />내보내기
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {/* 그룹 삭제 */}
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 shadow-lg">
            <h2 className="text-xl font-bold text-red-800 mb-2">위험 구역</h2>
            <p className="text-gray-700 mb-4">이 작업은 되돌릴 수 없습니다. 신중하게 결정해주세요.</p>
            <Button variant="danger" onClick={handleDeleteGroup}>
              <Trash2 className="w-5 h-5 mr-2" />그룹 삭제하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

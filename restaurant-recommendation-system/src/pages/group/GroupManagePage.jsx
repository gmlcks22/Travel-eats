import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import {
  getGroupById,
  updateGroup,
  deleteGroup,
  removeUserFromGroup,
} from "@utils/helpers/storage";
import {
  UserX,
  Trash2,
  ShieldCheck,
  Save,
  AlertCircle,
  Lock,
  Shield,
} from "lucide-react";

/**
 * 그룹 관리 페이지 (그룹 생성자 전용)
 */
export default function GroupManagePage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [preventReset, setPreventReset] = useState(false);
  const [lockJoin, setLockJoin] = useState(false);

  const fetchGroup = () => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        setGroup(result.group);
        setGroupName(result.group.name);
        setPreventReset(result.group.preventReset || false);
        setLockJoin(result.group.lockJoin || false);
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

  // 초기화 방지 토글
  const handleTogglePreventReset = () => {
    const newValue = !preventReset;
    const result = updateGroup(token, groupId, { preventReset: newValue });
    if (result.success) {
      setPreventReset(newValue);
      alert(
        `초기화 방지 기능이 ${newValue ? "활성화" : "비활성화"}되었습니다.`
      );
    } else {
      alert(result.message);
    }
  };

  // 그룹 참여 제한 토글
  const handleToggleLockJoin = () => {
    const newValue = !lockJoin;
    const result = updateGroup(token, groupId, { lockJoin: newValue });
    if (result.success) {
      setLockJoin(newValue);
      alert(`그룹 참여 제한이 ${newValue ? "활성화" : "비활성화"}되었습니다.`);
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
    if (
      window.confirm(
        "경고: 그룹을 삭제하면 모든 관련 데이터가 사라집니다. 정말로 삭제하시겠습니까?"
      )
    ) {
      const result = deleteGroup(token, groupId);
      alert(result.message);
      if (result.success) {
        navigate(routes.home);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  // 생성자 권한 확인
  if (!session || !group || session.user.id !== group.creatorId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <h1 className="text-2xl font-bold text-red-700 mb-4">접근 권한 없음</h1>
        <p className="text-gray-600">
          그룹 생성자만 이 페이지에 접근할 수 있습니다.
        </p>
        <Button onClick={() => navigate(routes.home)} className="mt-6">
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">그룹 관리</h1>
          <p className="text-gray-600 mb-8">
            그룹 이름 변경, 멤버 관리 및 그룹 설정을 할 수 있습니다.
          </p>

          {/* 그룹 이름 변경 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              그룹 이름 변경
            </h2>
            <form onSubmit={handleUpdateName} className="flex gap-3">
              <Input
                type="text"
                value={groupName}
                onChange={setGroupName}
                placeholder="새로운 그룹 이름"
                className="flex-grow"
              />
              <Button type="submit">
                <Save className="w-5 h-5 mr-2" />
                저장
              </Button>
            </form>
          </div>

          {/* 그룹 설정 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">그룹 설정</h2>

            {/* 초기화 방지 토글 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-3 flex-1">
                <Shield className="w-6 h-6 text-indigo-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">초기화 방지</h3>
                  <p className="text-sm text-gray-600">
                    새 멤버 참여 시 식당 추천 데이터 유지
                  </p>
                </div>
                <div className="group relative">
                  <AlertCircle className="w-5 h-5 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <strong>ON:</strong> 새 멤버가 참여해도 기존 식당 추천
                    데이터가 유지됩니다.
                    <br />
                    <strong>OFF:</strong> 새 멤버 참여 시 식당 추천을 다시
                    받아야 합니다.
                  </div>
                </div>
              </div>
              <button
                onClick={handleTogglePreventReset}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  preventReset ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    preventReset ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* 그룹 참여 제한 토글 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Lock className="w-6 h-6 text-orange-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">그룹 참여 제한</h3>
                  <p className="text-sm text-gray-600">
                    새로운 멤버의 그룹 참여 차단
                  </p>
                </div>
                <div className="group relative">
                  <AlertCircle className="w-5 h-5 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <strong>ON:</strong> 새로운 사람이 그룹 코드로 참여할 수
                    없습니다. (계획 확정 시 유용)
                    <br />
                    <strong>OFF:</strong> 누구나 그룹 코드로 참여할 수 있습니다.
                  </div>
                </div>
              </div>
              <button
                onClick={handleToggleLockJoin}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  lockJoin ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    lockJoin ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 멤버 관리 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">멤버 관리</h2>
            <ul className="space-y-3">
              {group.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-bold">{member.nickname}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      @{member.id}
                    </span>
                  </div>
                  {member.id === group.creatorId ? (
                    <div className="flex items-center gap-1 text-sm text-indigo-600 px-2 py-1 bg-indigo-100 rounded">
                      <ShieldCheck className="w-4 h-4" />
                      <span>그룹장</span>
                    </div>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      내보내기
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 그룹 삭제 */}
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 shadow-lg">
            <h2 className="text-xl font-bold text-red-800 mb-2">주의!</h2>
            <p className="text-gray-700 mb-4">
              이 작업은 되돌릴 수 없습니다. 신중하게 결정해주세요.
            </p>
            <Button variant="danger" onClick={handleDeleteGroup}>
              <Trash2 className="w-5 h-5 mr-2" />
              그룹 삭제하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

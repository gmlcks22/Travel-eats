import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { getCurrentUser, updateUser, clearCurrentUser } from "@utils/helpers/storage";
import { User, Lock, LogOut, Trash2 } from "lucide-react";

/**
 * 개인정보 수정 페이지
 * - 닉네임 변경
 * - 비밀번호 변경
 * - 로그아웃
 * - 회원 탈퇴 (선택사항)
 */
export default function MyPageEdit() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // 상태 관리
  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 로그인 체크 및 초기값 설정
  useEffect(() => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      navigate(routes.login);
      return;
    }
    setNickname(currentUser.nickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 닉네임 변경
  const handleNicknameUpdate = (e) => {
    e.preventDefault();

    if (nickname.trim().length < 2) {
      alert("닉네임은 최소 2글자 이상이어야 합니다.");
      return;
    }

    if (nickname === currentUser.nickname) {
      alert("현재 닉네임과 동일합니다.");
      return;
    }

    const result = updateUser(currentUser.id, { nickname });

    if (result.success) {
      alert("닉네임이 변경되었습니다!");
      navigate(routes.mypage);
    } else {
      alert("닉네임 변경에 실패했습니다.");
    }
  };

  // 비밀번호 변경
  const handlePasswordUpdate = (e) => {
    e.preventDefault();

    // 유효성 검사
    if (currentPassword !== currentUser.password) {
      alert("현재 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 4) {
      alert("새 비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword === currentPassword) {
      alert("현재 비밀번호와 다른 비밀번호를 입력해주세요.");
      return;
    }

    const result = updateUser(currentUser.id, { password: newPassword });

    if (result.success) {
      alert("비밀번호가 변경되었습니다!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } else {
      alert("비밀번호 변경에 실패했습니다.");
    }
  };

  // 로그아웃
  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      clearCurrentUser();
      alert("로그아웃 되었습니다.");
      navigate(routes.home);
    }
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
        <div className="max-w-3xl mx-auto">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">개인정보 수정</h1>
            <p className="text-gray-600">
              {currentUser.nickname}님의 정보를 수정할 수 있습니다
            </p>
          </div>

          {/* 닉네임 변경 섹션 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-800">닉네임 변경</h2>
            </div>

            <form onSubmit={handleNicknameUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 닉네임
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="2글자 이상 입력"
                  minLength={2}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  현재 닉네임: <strong>{currentUser.nickname}</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => navigate(routes.mypage)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1"
                >
                  변경하기
                </Button>
              </div>
            </form>
          </div>

          {/* 비밀번호 변경 섹션 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-800">비밀번호 변경</h2>
            </div>

            {!isChangingPassword ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsChangingPassword(true)}
                className="w-full"
              >
                비밀번호 변경하기
              </Button>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="현재 비밀번호 입력"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="새 비밀번호 입력 (최소 4자)"
                    minLength={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="새 비밀번호 다시 입력"
                    minLength={4}
                    required
                  />
                </div>

                {/* 비밀번호 일치 여부 표시 */}
                {newPassword && confirmPassword && (
                  <div className="flex items-center gap-2">
                    {newPassword === confirmPassword ? (
                      <p className="text-sm text-green-600">✓ 비밀번호가 일치합니다</p>
                    ) : (
                      <p className="text-sm text-red-600">✗ 비밀번호가 일치하지 않습니다</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-1"
                  >
                    변경하기
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* 계정 관리 섹션 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-red-200 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">계정 관리</h2>

            <div className="space-y-3">
              {/* 로그아웃 */}
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                로그아웃
              </Button>

              {/* 회원 탈퇴 (선택사항) */}
              {/* 
              <Button
                variant="danger"
                size="lg"
                onClick={() => {
                  if (window.confirm("정말로 회원 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) {
                    // 회원 탈퇴 로직 구현
                    alert("회원 탈퇴 기능은 준비 중입니다.");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-5 h-5" />
                회원 탈퇴
              </Button>
              */}
            </div>

            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                ⚠️ <strong>주의사항:</strong>
                <br />
                • 로그아웃 후에는 다시 로그인해야 합니다
                <br />
                • 비밀번호 변경 시 현재 비밀번호를 정확히 입력해주세요
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
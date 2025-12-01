import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { registerUser, loginUser } from "@utils/helpers/storage";
import { UserPlus } from "lucide-react";

/**
 * 회원가입 페이지
 * - 아이디, 비밀번호, 닉네임 입력
 * - 회원가입 성공 시 자동 로그인 후 온보딩 선호도 설정으로 이동
 */
export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  // 회원가입 처리
  const handleRegister = (e) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!userId.trim() || !password.trim() || !nickname.trim()) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (userId.length < 4) {
      setError("아이디는 4자 이상이어야 합니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 1. 회원가입 시도
    const registerResult = registerUser(userId, password, nickname);
    
    if (registerResult.success) {
      // 2. 가입 성공 시 자동 로그인
      const loginResult = loginUser(userId, password);
      if (loginResult.success) {
        alert(`${loginResult.session.user.nickname}님, 환영합니다!\n먼저 음식 취향을 알려주시겠어요? (나중에 변경 가능)`);
        // 3. App의 세션 상태 업데이트
        onLoginSuccess(loginResult.session);
        // 4. 온보딩 선호도 설정 페이지로 이동
        navigate(routes.onboardingPreference, { replace: true });
      } else {
        // 이 경우는 거의 없지만, 만약을 대비한 처리
        setError(loginResult.message);
        navigate(routes.login);
      }
    } else {
      setError(registerResult.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar />
      </header>

      {/* 회원가입 폼 */}
      <main className="container mx-auto px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            {/* 타이틀 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <UserPlus className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">회원가입</h1>
              <p className="text-gray-600 mt-2">새 계정을 만드세요</p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 회원가입 폼 */}
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="아이디"
                type="text"
                value={userId}
                onChange={setUserId}
                placeholder="4자 이상의 아이디"
                required
              />

              <Input
                label="닉네임"
                type="text"
                value={nickname}
                onChange={setNickname}
                placeholder="사용할 닉네임"
                required
              />

              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="6자 이상의 비밀번호"
                required
              />

              <Input
                label="비밀번호 확인"
                type="password"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder="비밀번호 재입력"
                required
              />

              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-full mt-6"
              >
                회원가입
              </Button>
            </form>

            {/* 로그인 링크 */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                이미 계정이 있으신가요?{" "}
                <button
                  onClick={() => navigate(routes.login)}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  로그인
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

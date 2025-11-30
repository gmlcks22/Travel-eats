import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { loginUser } from "@utils/helpers/storage";
import { LogIn } from "lucide-react";

/**
 * 로그인 페이지
 * - 아이디, 비밀번호 입력
 * - 로그인 성공 시 onLoginSuccess 콜백 호출
 */
export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 로그인 처리
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    // storage.js의 loginUser 함수 호출
    const result = loginUser(userId, password);

    if (result.success) {
      alert(`${result.session.user.nickname}님, 환영합니다!`);
      // 부모 컴포넌트(App.jsx)의 상태를 업데이트
      onLoginSuccess(result.session);
      // 메인 페이지로 이동
      navigate(routes.home, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar />
      </header>

      {/* 로그인 폼 */}
      <main className="container mx-auto px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            {/* 타이틀 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <LogIn className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">로그인</h1>
              <p className="text-gray-600 mt-2">계정에 로그인하세요</p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 로그인 폼 */}
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="아이디"
                type="text"
                value={userId}
                onChange={setUserId}
                placeholder="아이디를 입력하세요"
                required
              />

              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="비밀번호를 입력하세요"
                required
              />

              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-full mt-6"
              >
                로그인
              </Button>
            </form>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                계정이 없으신가요?{" "}
                <button
                  onClick={() => navigate(routes.register)}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  회원가입
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

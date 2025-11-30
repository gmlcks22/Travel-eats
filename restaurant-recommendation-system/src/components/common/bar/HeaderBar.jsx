import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, User, LogOut, Utensils, LogIn, UserPlus } from "lucide-react";
import routes from "@utils/constants/routes";

/**
 * 헤더바 컴포넌트
 * 모든 페이지 상단에 표시되는 네비게이션 바
 * @param {object} session - 현재 사용자 세션 객체
 * @param {function} handleLogout - 로그아웃 처리 함수
 */
export default function HeaderBar({ session, handleLogout }) {
  const navigate = useNavigate();

  // 로그아웃 확인 및 처리
  const onLogoutClick = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      handleLogout();
      // App.jsx에서 상태가 변경되면 리디렉션은 자동으로 처리될 수 있지만,
      // 즉각적인 피드백을 위해 홈으로 이동시킬 수 있습니다.
      navigate(routes.home);
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* 로고 */}
      <button
        onClick={() => navigate(routes.home)}
        className="flex items-center gap-2 text-2xl font-bold text-indigo-700 hover:text-indigo-800 transition-colors"
      >
        <Utensils className="w-8 h-8" />
        <span>나는 음식에 진심이다!</span>
      </button>

      {/* 네비게이션 메뉴 */}
      <nav className="flex items-center gap-3">
        {session ? (
          <>
            {/* 로그인된 상태 */}
            <button
              onClick={() => navigate(routes.home)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Home className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-700">홈</span>
            </button>

            <button
              onClick={() => navigate(routes.mypage)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <User className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-700">{session.user.nickname}</span>
            </button>

            <button
              onClick={onLogoutClick}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </button>
          </>
        ) : (
          <>
            {/* 로그인되지 않은 상태 */}
            <button
              onClick={() => navigate(routes.login)}
              className="flex items-center gap-2 px-4 py-2 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>로그인</span>
            </button>
            <button
              onClick={() => navigate(routes.register)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>회원가입</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

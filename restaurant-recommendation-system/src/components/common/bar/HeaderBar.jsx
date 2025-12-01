import React, { useState, useRef, useEffect } from "react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // 아바타 색상을 Tailwind 클래스로 매핑
  const COLOR_MAP = {
    indigo: { bg: "bg-indigo-600", hover: "hover:bg-indigo-700" },
    red: { bg: "bg-red-500", hover: "hover:bg-red-600" },
    green: { bg: "bg-green-500", hover: "hover:bg-green-600" },
    blue: { bg: "bg-blue-500", hover: "hover:bg-blue-600" },
    yellow: { bg: "bg-yellow-500", hover: "hover:bg-yellow-600" },
    purple: { bg: "bg-purple-600", hover: "hover:bg-purple-700" },
    pink: { bg: "bg-pink-500", hover: "hover:bg-pink-600" },
  };

  // 로그아웃 확인 및 처리
  const onLogoutClick = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      handleLogout();
      navigate(routes.home);
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* 로고 */}
      <button
        onClick={() => navigate(routes.home)}
        className="flex items-baseline gap-2 text-xl font-bold text-indigo-700 hover:text-indigo-800 transition-colors"
      >
        <Utensils className="w-6 h-6" />
        <span>나는 음식에 진심이다!</span>
      </button>

      {/* 네비게이션 메뉴 */}
      <nav className="flex items-center gap-4">
        {session ? (
          <div className="relative" ref={dropdownRef}>
            {/* 프로필 아바타 버튼 (드롭다운 토글) */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                COLOR_MAP[session.user.avatarColor || "indigo"]?.bg ||
                "bg-indigo-600"
              } text-white font-bold ${
                COLOR_MAP[session.user.avatarColor || "indigo"]?.hover ||
                "hover:bg-indigo-700"
              } transition-colors`}
              aria-label="사용자 메뉴 열기"
            >
              {session.user.nickname[0]}
            </button>

            {/* 드롭다운 메뉴 */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-2 px-2 ring-1 ring-gray-200 ring-opacity-5 z-10">
                <div className="px-4 py-2 text-sm font-semibold text-gray-800 border-b border-gray-200 rounded-t-md">
                  {session.user.nickname}
                </div>
                <button
                  onClick={() => {
                    navigate(routes.mypage);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-md"
                >
                  <User className="w-4 h-4" />
                  <span>마이페이지</span>
                </button>
                <button
                  onClick={() => {
                    onLogoutClick();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-100 flex items-center gap-2 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            )}
          </div>
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

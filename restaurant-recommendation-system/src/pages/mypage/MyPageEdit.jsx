import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import { useToast } from "@components/common/Toast";
import routes from "@utils/constants/routes";
import { updateUser } from "@utils/helpers/storage";
import { UserCog } from "lucide-react";

// 사용 가능한 아바타 색상 정의
const COLOR_MAP = {
  indigo: { bg: "bg-indigo-600", ring: "ring-indigo-500" },
  red: { bg: "bg-red-500", ring: "ring-red-500" },
  green: { bg: "bg-green-500", ring: "ring-green-500" },
  blue: { bg: "bg-blue-500", ring: "ring-blue-500" },
  yellow: { bg: "bg-yellow-500", ring: "ring-yellow-500" },
  purple: { bg: "bg-purple-600", ring: "ring-purple-500" },
  pink: { bg: "bg-pink-500", ring: "ring-pink-500" },
};
const AVATAR_COLORS = Object.keys(COLOR_MAP);

/**
 * 내 정보 수정 페이지
 */
export default function MyPageEdit({
  session,
  token,
  handleLogout,
  refreshSession,
}) {
  const navigate = useNavigate();
  const toast = useToast();

  if (!session) {
    // 이 페이지는 보호된 라우트를 통해 접근되므로 session이 항상 있어야 함
    return <div>로딩 중...</div>;
  }

  const [nickname, setNickname] = useState(session.user.nickname);
  const [avatarColor, setAvatarColor] = useState(
    session.user.avatarColor || "indigo"
  );
  const [error, setError] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    // ✅ 색상 변경도 확인
    if (
      nickname.trim() === session.user.nickname &&
      avatarColor === (session.user.avatarColor || "indigo")
    ) {
      setError("변경된 내용이 없습니다.");
      return;
    }

    const updates = {
      nickname: nickname.trim(),
      avatarColor: avatarColor,
    };
    const result = updateUser(token, updates);

    if (result.success) {
      toast.success("정보가 수정되었습니다! ✅");

      // 세션 새로고침 (App.jsx의 상태 업데이트)
      if (refreshSession) {
        refreshSession();
      }

      // 변경된 세션이 App.jsx에 반영되고 MyPage로 돌아감
      setTimeout(() => {
        navigate(routes.mypage);
      }, 500);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              {/* 프로필 미리보기 */}
              <div
                className={`inline-flex items-center justify-center w-24 h-24 ${COLOR_MAP[avatarColor].bg} rounded-full mb-4 text-white text-4xl font-bold`}
              >
                {nickname[0]}
              </div>
              <h1 className="text-3xl font-bold text-gray-800">내 정보 수정</h1>
              <p className="text-gray-600 mt-2">프로필 정보를 수정하세요</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <Input
                label="닉네임"
                type="text"
                value={nickname}
                onChange={setNickname}
                placeholder="새로운 닉네임"
                required
              />

              {/* 색상 선택 UI */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  프로필 색상
                </label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      className={`w-8 h-8 rounded-full ${
                        COLOR_MAP[color].bg
                      } transition-transform transform hover:scale-110 ${
                        avatarColor === color
                          ? `ring-2 ring-offset-2 ${COLOR_MAP[color].ring}`
                          : ""
                      }`}
                      aria-label={`${color} 색상 선택`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  type="button"
                  onClick={() => navigate(routes.mypage)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="flex-1"
                >
                  저장
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

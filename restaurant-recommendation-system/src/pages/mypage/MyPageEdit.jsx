import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { updateUser } from "@utils/helpers/storage";
import { UserCog } from "lucide-react";

/**
 * 내 정보 수정 페이지
 */
export default function MyPageEdit({ session, token, handleLogout }) {
  const navigate = useNavigate();
  
  if (!session) {
    // 이 페이지는 보호된 라우트를 통해 접근되므로 session이 항상 있어야 함
    return <div>로딩 중...</div>;
  }

  const [nickname, setNickname] = useState(session.user.nickname);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    if (nickname.trim() === session.user.nickname) {
      setError("변경된 내용이 없습니다.");
      return;
    }

    const result = updateUser(token, { nickname: nickname.trim() });

    if (result.success) {
      setSuccess("닉네임이 성공적으로 변경되었습니다.");
      alert("정보가 수정되었습니다.");
      // 변경된 세션이 App.jsx에 반영되고 MyPage로 돌아감
      navigate(routes.mypage);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <UserCog className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">내 정보 수정</h1>
              <p className="text-gray-600 mt-2">프로필 정보를 수정하세요</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="닉네임"
                type="text"
                value={nickname}
                onChange={setNickname}
                placeholder="새로운 닉네임"
                required
              />

              <div className="flex gap-3 mt-6">
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

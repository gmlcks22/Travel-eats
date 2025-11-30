import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { createGroup } from "@utils/helpers/storage";
import { Users, Copy, Check } from "lucide-react";

/**
 * 그룹 생성 페이지
 * - 그룹 이름 입력
 * - 그룹 생성 및 고유 코드 발급
 * - 코드 복사 기능
 */
export default function GroupCreatePage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copied, setCopied] = useState(false);

  // 그룹 생성 처리
  const handleCreateGroup = (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert("그룹 이름을 입력해주세요.");
      return;
    }
    
    // 토큰을 사용하여 그룹 생성
    const result = createGroup(token, groupName);

    if (result.success) {
      setCreatedGroup(result.group);
    } else {
      // 실패 시 메시지 표시 (예: 토큰 만료 등)
      alert(`그룹 생성에 실패했습니다: ${result.message}`);
    }
  };

  // 코드 복사 기능
  const handleCopyCode = () => {
    if (createdGroup) {
      navigator.clipboard.writeText(createdGroup.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 그룹 관리 페이지로 이동
  const handleGoToGroup = () => {
    navigate(routes.groupDetail.replace(":groupId", createdGroup.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {!createdGroup ? (
            /* 그룹 생성 폼 */
            <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">그룹 만들기</h1>
                <p className="text-gray-600 mt-2">
                  함께 여행할 친구들과 그룹을 만드세요
                </p>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-6">
                <Input
                  label="그룹 이름"
                  type="text"
                  value={groupName}
                  onChange={setGroupName}
                  placeholder="예: 제주도 여행"
                  required
                />

                <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                  <p className="text-sm text-indigo-800">
                    💡 <strong>그룹 생성 후</strong> 6자리 고유 코드가 발급됩니다.
                    <br />
                    이 코드를 친구들에게 공유하여 그룹에 초대하세요!
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full"
                >
                  그룹 만들기
                </Button>
              </form>
            </div>
          ) : (
            /* 그룹 생성 완료 */
            <div className="bg-white rounded-2xl p-8 border-2 border-green-200 shadow-lg">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">
                  그룹이 생성되었습니다!
                </h1>
                <p className="text-gray-600 mt-2">
                  아래 코드를 친구들에게 공유하세요
                </p>
              </div>

              <div className="space-y-6">
                {/* 그룹 정보 */}
                <div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">그룹 이름</p>
                    <p className="text-2xl font-bold text-indigo-800">
                      {createdGroup.name}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">그룹 코드</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-4xl font-mono font-bold text-indigo-600">
                        {createdGroup.code}
                      </p>
                      <button
                        onClick={handleCopyCode}
                        className={`p-3 rounded-lg transition-colors ${
                          copied
                            ? "bg-green-500 text-white"
                            : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                        }`}
                      >
                        {copied ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <Copy className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ 코드가 복사되었습니다!
                      </p>
                    )}
                  </div>
                </div>

                {/* 안내 메시지 */}
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    📌 <strong>다음 단계:</strong>
                    <br />
                    1. 친구들에게 그룹 코드를 공유하세요
                    <br />
                    2. 모든 멤버가 참여하면 여행 계획을 시작하세요
                    <br />
                    3. 각자의 음식 선호도를 입력하면 맞춤 식당이 추천됩니다
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGoToGroup}
                    className="flex-1"
                  >
                    그룹 관리하기
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate(routes.home)}
                    className="flex-1"
                  >
                    홈으로
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

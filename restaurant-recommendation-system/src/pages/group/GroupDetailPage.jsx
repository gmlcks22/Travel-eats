import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import { Users, MapPin, Calendar, Copy, Check, Settings } from "lucide-react";

/**
 * 그룹 상세 페이지
 * - 그룹 정보, 멤버 목록 확인
 * - 여행 계획 시작, 결과 보기 등 액션 수행
 */
export default function GroupDetailPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [copied, setCopied] = useState(false);

  // 그룹 정보 로드
  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);

      if (result.success) {
        setGroup(result.group);
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, token, navigate]);

  // 코드 복사 기능
  const handleCopyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 여행 계획 시작
  const handleStartPlanning = () => {
    navigate(routes.tripPlan.replace(":groupId", groupId));
  };

  // 식당 추천 결과 보기
  const handleViewResults = () => {
    navigate(routes.foodResult.replace(":groupId", groupId));
  };

  if (!group || !session) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  const isCreator = group.creatorId === session.user.id;
  const hasRestaurants = group.restaurants && group.restaurants.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 그룹 헤더 */}
        <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{group.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-mono font-bold">
                    {group.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className={`p-2 rounded-lg transition-colors ${
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {copied && <span className="text-sm text-green-600">복사됨!</span>}
                </div>
              </div>
              {isCreator && (
                <Button 
                  variant="secondary" 
                  onClick={() => navigate(routes.groupManage.replace(':groupId', groupId))}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  그룹 관리
                </Button>
              )}
            </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              title="멤버 수"
              value={`${group.members.length}명`}
              icon={<Users />}
              color="indigo"
            />
            {group.tripPlan ? (
              <>
                <InfoCard
                  title="여행지"
                  value={group.tripPlan.region}
                  icon={<MapPin />}
                  color="green"
                />
                <InfoCard
                  title="여행 기간"
                  value={`${group.tripPlan.days}일`}
                  icon={<Calendar />}
                  color="purple"
                />
              </>
            ) : (
              <div className="col-span-2 flex items-center justify-center bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
                <p className="text-yellow-800">아직 여행 계획이 설정되지 않았습니다</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 멤버 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                그룹 멤버
              </h2>
              <div className="space-y-3">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                        {member.nickname[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{member.nickname}</p>
                        <p className="text-sm text-gray-500">@{member.id}</p>
                      </div>
                    </div>
                    {member.id === group.creatorId && (
                      <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded">
                        그룹장
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-4">
            {!group.tripPlan ? (
              <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-3">다음 단계</h3>
                <p className="text-sm text-gray-600 mb-4">
                  여행 계획을 설정하고 멤버들의 음식 선호도를 입력하세요.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartPlanning}
                  className="w-full"
                >
                  여행 계획 시작하기
                </Button>
              </div>
            ) : hasRestaurants ? (
              <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-3">추천 식당</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {group.restaurants.length}개의 식당이 추천되었습니다!
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleViewResults}
                  className="w-full"
                >
                  추천 결과 보기
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border-2 border-yellow-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-3">음식 선호도 입력</h3>
                <p className="text-sm text-gray-600 mb-4">
                  모든 멤버가 선호도를 입력하면 추천이 시작됩니다.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(routes.foodPreference.replace(":groupId", groupId))}
                  className="w-full"
                >
                  선호도 입력하기
                </Button>
              </div>
            )}

            {/* 안내 */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200">
              <p className="text-sm text-gray-700">
                💡 <strong>팁:</strong>
                <br />
                • 그룹 코드를 친구들에게 공유하세요
                <br />
                • 모든 멤버의 선호도가 중요합니다
                <br />
                • 여행 전에 미리 계획을 세우세요
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

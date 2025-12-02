import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { Users, MapPin, Sparkles, TrendingUp } from "lucide-react";

/**
 * 메인 페이지
 * - 서비스 소개
 * - 로그인/회원가입 유도
 * - 로그인 후: 그룹 생성/참여 버튼
 * @param {object} session - 현재 사용자 세션 객체
 * @param {function} handleLogout - 로그아웃 처리 함수
 */
export default function MainPage({ session, handleLogout }) {
  const navigate = useNavigate();

  // 기능 소개 카드 데이터
  const features = [
    {
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      title: "그룹 여행 계획",
      description:
        "친구들과 함께 여행 그룹을 만들고 모두의 선호도를 반영한 식당을 찾아보세요.",
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      title: "AI 기반 추천",
      description:
        "각 멤버의 음식 선호도를 분석하여 모두가 만족할 수 있는 식당을 추천합니다.",
    },
    {
      icon: <MapPin className="w-8 h-8 text-green-600" />,
      title: "지역 기반 검색",
      description:
        "여행지와 일정에 맞춰 주변 식당을 찾고 합리적인 선택을 할 수 있습니다.",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
      title: "합의 점수 시스템",
      description:
        "그룹 멤버들의 선호도를 종합하여 가장 적합한 식당을 순위로 보여줍니다.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-16">
        {/* 히어로 섹션 */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            함께하는 여행, 함께 찾는 맛집
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            그룹 멤버 모두가 만족하는 식당을 AI가 추천해드립니다
          </p>

          {/* 로그인 여부에 따른 버튼 */}
          {session ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(routes.groupCreate)}
                >
                  새 그룹 만들기
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(routes.groupJoin)}
                >
                  그룹 참여하기
                </Button>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(routes.myGroups)}
                className="flex items-center gap-2"
              >
                <Users className="w-5 h-5" />내 그룹 보기
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(routes.register)}
              >
                시작하기
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(routes.login)}
              >
                로그인
              </Button>
            </div>
          )}
        </div>

        {/* 기능 소개 섹션 */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            이런 기능을 제공합니다
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 사용 방법 안내 */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-10 border-2 border-indigo-200">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            사용 방법
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                회원가입 및 그룹 생성
              </h3>
              <p className="text-gray-600">
                계정을 만들고 여행 그룹을 생성하세요. 친구들을 초대할 수 있는
                코드가 발급됩니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                음식 선호도 입력
              </h3>
              <p className="text-gray-600">
                각 멤버가 좋아하는 음식, 싫어하는 음식, 못 먹는 음식을
                입력합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                맞춤 식당 추천 받기
              </h3>
              <p className="text-gray-600">
                AI가 분석한 결과를 바탕으로 모두가 만족할 식당 목록을
                확인하세요.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

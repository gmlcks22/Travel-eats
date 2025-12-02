import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { CheckboxGroup, RangeInput } from "@components/common/Input";
import { useToast } from "@components/common/Toast";
import routes from "@utils/constants/routes";
import { getGroupById, updateUser } from "@utils/helpers/storage";
import { FOOD_CATEGORIES } from "@utils/helpers/foodRecommendation";
import { Heart, ThumbsDown, SkipForward } from "lucide-react";

/**
 * 음식 선호도 입력 페이지
 * - 온보딩(groupId 없음)과 그룹 내(groupId 있음) 두 가지 케이스를 모두 처리
 * - 좋아하는 음식 종류와 선호하지 않는 음식 종류는 상호 배타적
 */
export default function FoodPreferencePage({
  session,
  token,
  handleLogout,
  refreshSession,
}) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const location = useLocation();
  const toast = useToast();

  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 선호도 state (맛/재료 관련 제거)
  const [likedCategories, setLikedCategories] = useState([]);
  const [dislikedCategories, setDislikedCategories] = useState([]);

  // 그룹 정보(선택적) 및 기존 선호도 로드
  useEffect(() => {
    if (token && session) {
      // 그룹 컨텍스트일 경우에만 그룹 정보 로드
      if (groupId) {
        const groupResult = getGroupById(token, groupId);
        if (groupResult.success) {
          setGroup(groupResult.group);
        } else {
          toast.error(groupResult.message);
          navigate(routes.home);
          return;
        }
      }

      // 기존 사용자 선호도가 있으면 불러오기
      if (session.user.preference) {
        const pref = session.user.preference;
        setLikedCategories(pref.likedCategories || []);
        setDislikedCategories(pref.dislikedCategories || []);
      }
      setIsLoading(false);
    }
  }, [groupId, token, session, navigate]);

  // 좋아하는 카테고리 변경 핸들러 (선호하지 않는 카테고리에서 제거)
  const handleLikedCategoriesChange = (newLikedCategories) => {
    setLikedCategories(newLikedCategories);
    // 좋아하는 카테고리에 추가된 항목을 선호하지 않는 카테고리에서 제거
    setDislikedCategories((prev) =>
      prev.filter((cat) => !newLikedCategories.includes(cat))
    );
  };

  // 선호하지 않는 카테고리 변경 핸들러 (좋아하는 카테고리에서 제거)
  const handleDislikedCategoriesChange = (newDislikedCategories) => {
    setDislikedCategories(newDislikedCategories);
    // 선호하지 않는 카테고리에 추가된 항목을 좋아하는 카테고리에서 제거
    setLikedCategories((prev) =>
      prev.filter((cat) => !newDislikedCategories.includes(cat))
    );
  };

  // 선호도 저장
  const handleSavePreference = (e) => {
    e.preventDefault();

    const preference = {
      likedCategories,
      dislikedCategories,
      updatedAt: new Date().toISOString(),
    };

    const result = updateUser(token, { preference });

    if (result.success) {
      toast.success("선호도가 저장되었습니다! ✨");

      // 세션 새로고침 (App.jsx의 상태 업데이트)
      if (refreshSession) {
        refreshSession();
      }

      setTimeout(() => {
        // location.state에서 returnTo를 확인
        const returnTo = location.state?.returnTo;

        if (returnTo) {
          // 명시적으로 돌아갈 페이지가 지정된 경우
          navigate(returnTo);
        } else if (groupId) {
          // 그룹 컨텍스트: 그룹 상세 페이지로 이동
          navigate(routes.groupDetail.replace(":groupId", groupId));
        } else {
          // 온보딩 컨텍스트: 메인 페이지로 이동
          navigate(routes.home);
        }
      }, 500);
    } else {
      toast.error(`저장에 실패했습니다: ${result.message}`);
    }
  };

  const handleSkip = () => {
    navigate(routes.home);
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  // 그룹 컨텍스트가 아닐 경우(온보딩), group 객체가 없어도 페이지가 렌더링되어야 함.
  if (groupId && !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        그룹 정보 로딩 중...
      </div>
    );
  }

  const categories = Object.values(FOOD_CATEGORIES);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                음식 선호도 입력
              </h1>
              <p className="text-gray-600">
                {session.user.nickname}님의 음식 취향을 알려주세요.{" "}
                {groupId ? "" : "언제든지 수정할 수 있습니다."}
              </p>
              {group && (
                <p className="text-sm text-indigo-600 mt-1">
                  그룹: {group.name}
                </p>
              )}
            </div>

            <form onSubmit={handleSavePreference} className="space-y-8">
              {/* 좋아하는 음식 종류 */}
              <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-800">
                    좋아하는 음식 종류
                  </h2>
                </div>
                <CheckboxGroup
                  options={categories}
                  selected={likedCategories}
                  onChange={handleLikedCategoriesChange}
                  disabled={dislikedCategories}
                />
              </div>

              {/* 선호하지 않는 음식 종류 */}
              <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsDown className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-800">
                    선호하지 않는 음식 종류
                  </h2>
                </div>
                <CheckboxGroup
                  options={categories}
                  selected={dislikedCategories}
                  onChange={handleDislikedCategoriesChange}
                  disabled={likedCategories}
                />
              </div>

              {/* 버튼 */}
              <div className="mt-8 flex gap-3">
                {groupId ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    type="button"
                    onClick={() =>
                      navigate(routes.groupDetail.replace(":groupId", groupId))
                    }
                    className="flex-1"
                  >
                    취소
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    type="button"
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    <SkipForward className="w-5 h-5" />
                    나중에 하기
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="flex-1"
                >
                  저장하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

import React from "react";
import { Star, MapPin, Users, Calendar, Crown, Check } from "lucide-react";

/**
 * 정보 카드 (통계 등)
 */
export function InfoCard({ title, value, icon, color = "indigo" }) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-xl p-4 shadow-md ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">{icon}</div>
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 식당 카드
 */
export function RestaurantCard({
  restaurant,
  onClick,
  showSelectButton = false,
  isSelected = false,
}) {
  const photoUrl =
    restaurant.images?.[0] ||
    "https://via.placeholder.com/400x300?text=No+Image";

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border-2 shadow-md hover:shadow-lg transition-all cursor-pointer ${
        isSelected ? "border-green-500 bg-green-50" : "border-indigo-200"
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={photoUrl}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
        {isSelected && (
          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2">
            <Check className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {restaurant.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          {restaurant.rating && (
            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">
                {restaurant.rating}
              </span>
            </div>
          )}
          {restaurant.user_ratings_total && (
            <span className="text-sm text-gray-600">
              ({restaurant.user_ratings_total}개 리뷰)
            </span>
          )}
          {restaurant.avgPrice !== undefined && (
            <span className="text-sm font-medium text-green-600">
              {"₩".repeat(restaurant.avgPrice || 1)}
            </span>
          )}
        </div>

        {restaurant.category && (
          <div className="mb-3">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-medium">
              {restaurant.category}
            </span>
          </div>
        )}

        <div className="flex items-start gap-2 text-gray-600 text-sm">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">
            {restaurant.location?.address || "주소 정보 없음"}
          </span>
        </div>

        {showSelectButton && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                isSelected
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {isSelected ? "✓ 선택됨" : "선택하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 그룹 카드
 */
export function GroupCard({ group, session, onClick, onLeave, onDelete }) {
  const isCreator = group.creatorId === session.user.id;
  const isMember = group.members.some((m) =>
    typeof m === "string" ? m === session.user.id : m.id === session.user.id
  );

  return (
    <div
      className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-800">{group.name}</h3>
        {isCreator && (
          <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded flex items-center gap-1">
            <Crown className="w-3 h-3" />
            그룹장
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Users className="w-4 h-4" />
          <span>{group.members.length}명의 멤버</span>
        </div>
        {group.tripPlan?.days && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{group.tripPlan.days.length}일 여행</span>
          </div>
        )}
        {group.tripPlan?.days?.[0]?.description && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{group.tripPlan.days[0].description}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-mono text-sm font-bold">
          {group.code}
        </span>
      </div>

      {isMember && (
        <div className="flex gap-2 pt-3">
          {isCreator ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(group.id);
              }}
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              그룹 삭제
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLeave(group.id);
              }}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              그룹 나가기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

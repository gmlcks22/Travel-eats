import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import { getPlaceDetails } from "@utils/api/googlePlaces";
import {
  ArrowLeft,
  MapPin,
  Star,
  ExternalLink,
  Navigation,
  Clock,
  Phone,
  Globe,
  MessageSquare,
  DollarSign,
} from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// 가격 수준 헬퍼
const renderPriceLevel = (priceLevel) => {
  if (typeof priceLevel !== "number" || priceLevel < 1) {
    return <span className="text-gray-500">정보 없음</span>;
  }

  const priceLabels = {
    1: "저렴 (~10,000원)",
    2: "보통 (10,000~30,000원)",
    3: "비싼 (30,000~60,000원)",
    4: "고급 (60,000원+)",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-green-600 text-lg">
        {"$".repeat(priceLevel)}
        <span className="text-gray-300">{"$".repeat(4 - priceLevel)}</span>
      </span>
      <span className="text-sm text-gray-600">({priceLabels[priceLevel]})</span>
    </div>
  );
};

// 리뷰 카드 컴포넌트
const ReviewCard = ({ review }) => (
  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex items-center mb-2">
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span className="font-bold">{review.rating}</span>
      </div>
      <span className="mx-2">·</span>
      <span className="font-semibold text-gray-800">{review.author_name}</span>
      <span className="ml-auto text-xs text-gray-500">
        {review.relative_time_description}
      </span>
    </div>
    <p className="text-gray-700 text-sm">{review.text}</p>
  </div>
);

/**
 * 식당 상세 페이지
 */
export default function FoodDetailPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId, restaurantId } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [group, setGroup] = useState(null);

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    navigate(-1); // 브라우저 히스토리 뒤로가기
  };

  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        const groupData = result.group;
        setGroup(groupData);

        // restaurantsByDay에서 식당 찾기
        let foundRestaurant = null;
        if (groupData.restaurantsByDay) {
          for (const dayIdx in groupData.restaurantsByDay) {
            const dayRestaurants = groupData.restaurantsByDay[dayIdx];
            const found = dayRestaurants.find(
              (r) => r.place_id === restaurantId
            );
            if (found) {
              foundRestaurant = {
                place_id: found.place_id,
                name: found.name,
                category: found.types?.[0] || "restaurant",
                rating: found.rating || 0,
                user_ratings_total: found.user_ratings_total || 0,
                priceLevel: found.price_level ?? null,
                location: {
                  address: found.vicinity || found.formatted_address || "",
                  lat: found.geometry?.location?.lat || 0,
                  lng: found.geometry?.location?.lng || 0,
                },
                images:
                  found.photos?.map(
                    (photo) =>
                      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${API_KEY}`
                  ) || [],
              };
              break;
            }
          }
        }

        if (foundRestaurant) {
          setRestaurant(foundRestaurant);

          // Place Details API 호출
          const fetchDetails = async () => {
            setDetailsLoading(true);
            const result = await getPlaceDetails(foundRestaurant.place_id);
            if (result.success) {
              setDetails(result.details);
            } else {
              console.error(result.message);
            }
            setDetailsLoading(false);
          };
          fetchDetails();
        } else {
          alert("식당 정보를 찾을 수 없습니다.");
          navigate(routes.foodResult.replace(":groupId", groupId));
        }
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, restaurantId, token, navigate]);

  const handleViewOnGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/place/?q=place_id:${restaurantId}`,
      "_blank"
    );
  };

  const handleGetDirections = () => {
    if (restaurant?.location?.lat && restaurant?.location?.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`,
        "_blank"
      );
    }
  };

  if (!group || !session || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    restaurant.name
  )}&query_place_id=${restaurant.place_id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* 뒤로가기 버튼 */}
        <Button variant="secondary" onClick={handleGoBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* 식당 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* 이미지 */}
              <div>
                {restaurant.images && restaurant.images[0] ? (
                  <img
                    src={restaurant.images[0]}
                    alt={restaurant.name}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-300 rounded-xl flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex flex-col justify-center">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm self-start">
                  {restaurant.category}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
                  {restaurant.name}
                </h1>
                <div className="space-y-4 mt-4">
                  {/* 별점 */}
                  <div className="flex items-center gap-3 text-lg">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{restaurant.rating}</span>
                    <span className="text-gray-500 text-base">
                      ({restaurant.user_ratings_total || 0}개 평가)
                    </span>
                  </div>

                  {/* 가격대 */}
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">가격대:</span>
                      {renderPriceLevel(restaurant.priceLevel)}
                    </div>
                  </div>

                  {/* 주소 */}
                  <div className="flex items-start gap-3 text-lg">
                    <MapPin className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    <span>{restaurant.location?.address}</span>
                  </div>

                  {/* 전화번호 */}
                  {details?.formatted_phone_number && (
                    <div className="flex items-center gap-3 text-lg">
                      <Phone className="w-6 h-6 text-gray-600" />
                      <a
                        href={`tel:${details.formatted_phone_number}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {details.formatted_phone_number}
                      </a>
                    </div>
                  )}
                </div>

                {/* 버튼 */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Google 지도
                  </a>
                  {details?.website && (
                    <a
                      href={details.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      웹사이트
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 상세 정보 로딩 */}
          {detailsLoading ? (
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 text-center">
              <p className="text-gray-500">상세 정보 로딩 중...</p>
            </div>
          ) : details ? (
            <>
              {/* 리뷰 */}
              {details.reviews && details.reviews.length > 0 && (
                <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-7 h-7 text-indigo-600" />
                    최신 리뷰
                  </h2>
                  <div className="space-y-4">
                    {details.reviews.map((review, i) => (
                      <ReviewCard key={i} review={review} />
                    ))}
                  </div>
                </div>
              )}

              {/* 영업 시간 */}
              {details.opening_hours?.weekday_text && (
                <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-7 h-7 text-indigo-600" />
                    영업 시간
                  </h2>
                  <ul className="space-y-1">
                    {details.opening_hours.weekday_text.map((line, i) => (
                      <li key={i} className="text-gray-700">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 text-center">
              <p className="text-gray-500">
                추가 상세 정보를 불러올 수 없습니다.
              </p>
            </div>
          )}

          {/* 지도 */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">위치</h2>
            <div className="h-80 bg-gray-200 rounded-lg overflow-hidden">
              <iframe
                title="Restaurant Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=place_id:${restaurant.place_id}`}
              ></iframe>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="secondary" size="lg" onClick={handleGoBack}>
              뒤로가기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

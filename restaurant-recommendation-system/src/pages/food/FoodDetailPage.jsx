import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { getPlaceDetails } from "@utils/api/googlePlaces"; // 상세 정보 API 함수
import { MapPin, Star, Users, ExternalLink, Clock, MessageSquare, Phone } from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// 가격 수준 헬퍼
const renderPriceLevel = (priceLevel) => {
  if (typeof priceLevel !== 'number' || priceLevel < 1) {
    return <span className="text-gray-500">정보 없음</span>;
  }
  return (
    <span className="font-bold text-green-600">
      {'$'.repeat(priceLevel)}
      <span className="text-gray-300">{'$'.repeat(4 - priceLevel)}</span>
    </span>
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
      <span className="ml-auto text-xs text-gray-500">{review.relative_time_description}</span>
    </div>
    <p className="text-gray-700 text-sm">{review.text}</p>
  </div>
);


/**
 * 식당 상세 정보 페이지 (Place Details API 연동)
 */
export default function FoodDetailPage({ session, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const location = useLocation();
  
  const { restaurant } = location.state || {};
  
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  useEffect(() => {
    if (restaurant?.place_id) {
      const fetchDetails = async () => {
        setDetailsLoading(true);
        const result = await getPlaceDetails(restaurant.place_id);
        if (result.success) {
          setDetails(result.details);
        } else {
          // 상세 정보 로드 실패 시에도 페이지는 기본적인 정보로 렌더링됩니다.
          console.error(result.message);
        }
        setDetailsLoading(false);
      };
      fetchDetails();
    } else {
        setDetailsLoading(false);
    }
  }, [restaurant?.place_id]);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <h1 className="text-2xl font-bold text-red-700 mb-4">식당 정보를 찾을 수 없습니다</h1>
        <p className="text-gray-600">결과 목록 페이지에서 식당을 다시 선택해주세요.</p>
        <Button onClick={() => navigate(routes.foodResult.replace(':groupId', groupId))} className="mt-6">
          결과 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar session={session} handleLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 식당 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div>
                <img src={restaurant.images[0]} alt={restaurant.name} className="w-full h-64 object-cover rounded-xl"/>
              </div>
              <div className="flex flex-col justify-center">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm self-start">{restaurant.category}</span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">{restaurant.name}</h1>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-3 text-lg"><Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /><span className="font-bold">{restaurant.rating}</span><span className="text-gray-500 text-base">({restaurant.user_ratings_total || 0}개 평가)</span></div>
                  <div className="flex items-center gap-3 text-lg"><span className="w-6 text-center">💰</span><span>가격대: {renderPriceLevel(restaurant.avgPrice)}</span></div>
                  <div className="flex items-start gap-3 text-lg"><MapPin className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" /><span>{restaurant.location?.address}</span></div>
                  {details?.formatted_phone_number && <div className="flex items-center gap-3 text-lg"><Phone className="w-6 h-6 text-gray-600" /><span>{details.formatted_phone_number}</span></div>}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                   <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"><ExternalLink className="w-5 h-5" />Google 지도</a>
                   {details?.website && <a href={details.website} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"><ExternalLink className="w-5 h-5" />웹사이트</a>}
                </div>
              </div>
            </div>
          </div>
          
          {/* 상세 정보 (리뷰, 영업시간) - 로딩 및 데이터 유무에 따라 표시 */}
          {detailsLoading ? (
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 text-center"><p className="text-gray-500">상세 정보 로딩 중...</p></div>
          ) : details ? (
            <>
              {details.reviews && (
                <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare className="w-7 h-7 text-indigo-600" />최신 리뷰</h2>
                  <div className="space-y-4">{details.reviews.map((review, i) => <ReviewCard key={i} review={review} />)}</div>
                </div>
              )}
              {details.opening_hours?.weekday_text && (
                 <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-7 h-7 text-indigo-600" />영업 시간</h2>
                  <ul className="space-y-1">{details.opening_hours.weekday_text.map((line, i) => <li key={i} className="text-gray-700">{line}</li>)}</ul>
                </div>
              )}
            </>
          ) : <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 text-center"><p className="text-gray-500">추가 상세 정보를 불러올 수 없습니다.</p></div>}
          
          {/* 지도 Iframe */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">위치</h2>
            <div className="h-80 bg-gray-200 rounded-lg overflow-hidden">
              <iframe title="Restaurant Location" width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}`}></iframe>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button variant="secondary" size="lg" onClick={() => navigate(routes.foodResult.replace(":groupId", groupId))}>목록으로 돌아가기</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { getGroupById, updateGroup } from "@utils/helpers/storage";
import { Map, Pin, Milestone, Plus, Trash2 } from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "1rem",
  border: "2px solid #e5e7eb"
};

// 기본 지도 중심 (서울)
const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

const libraries = ["places"];

/**
 * 여행 계획 페이지 (지도 기반)
 */
export default function TripPlanPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [numDays, setNumDays] = useState(1);
  const [tripDays, setTripDays] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries,
  });

  // 그룹 정보 및 기존 계획 로드
  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        setGroup(result.group);
        if (result.group.tripPlan?.days) {
            const existingDays = result.group.tripPlan.days;
            setNumDays(existingDays.length);
            setTripDays(existingDays);
        } else {
            // 새 계획 초기화
            setTripDays([{ day: 1, location: null, radius: 1000, description: "" }]);
        }
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, token, navigate]);

  // 날짜 수 변경 시
  const handleNumDaysChange = (newNumDays) => {
    const num = Math.max(1, parseInt(newNumDays, 10) || 1);
    setNumDays(num);
    
    const newTripDays = Array.from({ length: num }, (_, i) => {
      return tripDays[i] || { day: i + 1, location: null, radius: 1000, description: "" };
    });
    setTripDays(newTripDays);
    if(activeDayIndex >= num) {
        setActiveDayIndex(num - 1);
    }
  };

  // 지도 클릭 시
  const onMapClick = (e) => {
    const newLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    const newTripDays = [...tripDays];
    newTripDays[activeDayIndex].location = newLocation;
    setTripDays(newTripDays);
  };
  
  // 반경 변경 시
  const handleRadiusChange = (newRadius) => {
    const radius = Math.max(100, parseInt(newRadius, 10));
    const newTripDays = [...tripDays];
    newTripDays[activeDayIndex].radius = radius;
    setTripDays(newTripDays);
  };
  
  // 설명 변경 시
  const handleDescriptionChange = (newDescription) => {
    const newTripDays = [...tripDays];
    newTripDays[activeDayIndex].description = newDescription;
    setTripDays(newTripDays);
  };

  // 저장
  const handleSave = () => {
    const hasInvalidDay = tripDays.some(day => !day.location || !day.description.trim());
    if(hasInvalidDay) {
        alert("모든 날짜의 위치와 설명을 입력해주세요.");
        return;
    }
    
    const tripPlan = { days: tripDays };
    const result = updateGroup(token, groupId, { tripPlan });

    if (result.success) {
      alert("여행 계획이 저장되었습니다.");
      navigate(routes.groupDetail.replace(":groupId", groupId));
    } else {
      alert(`저장 실패: ${result.message}`);
    }
  };
  
  const currentDay = tripDays[activeDayIndex];

  if (!group || !session) return <div>로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">여행 계획 설정</h1>
            <p className="text-gray-600 mt-2">지도를 클릭하여 각 날짜의 여행지를 설정하세요.</p>
          </div>

          {/* 여행 기간 설정 */}
          <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-md border-2 border-indigo-200">
             <label className="font-bold text-lg">여행 기간:</label>
             <Input
                type="number"
                value={numDays}
                onChange={(val) => handleNumDaysChange(val)}
                className="w-24"
                min="1"
             />
             <span className="text-lg">일</span>
          </div>

          {/* 날짜 선택 탭 */}
          <div className="flex space-x-2 border-b-2 border-gray-200 mb-6">
            {tripDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setActiveDayIndex(index)}
                className={`px-4 py-3 font-bold transition-colors ${
                  activeDayIndex === index
                    ? "border-b-4 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-indigo-500"
                }`}
              >
                {index + 1}일차
              </button>
            ))}
          </div>

          {/* 지도 및 설정 (현재 활성화된 날짜 기준) */}
          {currentDay && (
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-200 space-y-6">
                <h2 className="text-xl font-bold text-indigo-700">{activeDayIndex + 1}일차 계획</h2>
                {loadError && <div>지도 로딩 오류: API 키를 확인해주세요.</div>}
                {!isLoaded ? <div>지도 로딩 중...</div> : (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={currentDay.location || defaultCenter}
                        zoom={13}
                        onClick={onMapClick}
                    >
                        {currentDay.location && (
                            <>
                                <Marker position={currentDay.location} />
                                <Circle 
                                    center={currentDay.location}
                                    radius={currentDay.radius}
                                    options={{
                                        strokeColor: "#818cf8",
                                        strokeOpacity: 0.8,
                                        strokeWeight: 2,
                                        fillColor: "#c7d2fe",
                                        fillOpacity: 0.35,
                                    }}
                                />
                            </>
                        )}
                    </GoogleMap>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="font-bold text-gray-700 block mb-2">위치 설명</label>
                        <Input 
                            value={currentDay.description}
                            onChange={handleDescriptionChange}
                            placeholder="예: 서울숲 근처, 강남역 11번 출구"
                        />
                         <p className="text-sm text-gray-500 mt-1">지도에서 선택한 위치를 설명해주세요.</p>
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 block mb-2">검색 반경: {currentDay.radius}m</label>
                         <input
                            type="range"
                            min="100"
                            max="20000"
                            step="100"
                            value={currentDay.radius}
                            onChange={(e) => handleRadiusChange(e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="mt-8 flex justify-end gap-4">
              <Button variant="secondary" onClick={() => navigate(routes.groupDetail.replace(':groupId', groupId))}>
                  취소
              </Button>
              <Button variant="primary" size="lg" onClick={handleSave}>
                  여행 계획 저장
              </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
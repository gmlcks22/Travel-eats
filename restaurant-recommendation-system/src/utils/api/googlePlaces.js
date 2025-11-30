/**
 * Google Places API 연동을 위한 유틸리티
 * 
 * @see https://developers.google.com/maps/documentation/places/web-service/overview
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

/**
 * [Legacy] Google Places API를 사용하여 텍스트 쿼리로 장소를 검색합니다.
 * @param {string} query - 검색어 (예: "서울 강남역 맛집")
 * @returns {Promise<{success: boolean, places: Array, message: string}>}
 */
export const searchPlacesByText = async (query) => {
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    console.error("Google Places API 키가 설정되지 않았습니다. `.env.local` 파일을 생성하고 `VITE_GOOGLE_PLACES_API_KEY`를 설정해주세요.");
    return Promise.resolve({ success: false, places: [], message: "API 키가 설정되지 않았습니다." });
  }

  const url = `/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}&language=ko`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK") return { success: true, places: data.results, message: "장소 검색에 성공했습니다." };
    return { success: false, places: [], message: `API 오류: ${data.status} - ${data.error_message || "알 수 없는 오류"}` };
  } catch (error) {
    console.error("Google Places API 호출 중 네트워크 오류 발생:", error);
    return { success: false, places: [], message: "네트워크 오류로 인해 장소를 검색할 수 없습니다." };
  }
};


/**
 * Google Places API 'Nearby Search'를 사용하여 특정 위치 주변의 장소를 검색합니다.
 * @param {{location: {lat: number, lng: number}, radius: number, keyword: string}} params
 * @returns {Promise<{success: boolean, places: Array, message: string}>}
 */
export const searchPlacesByLocation = async ({ location, radius, keyword }) => {
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    console.error("Google Places API 키가 설정되지 않았습니다. `.env.local` 파일을 생성하고 `VITE_GOOGLE_PLACES_API_KEY`를 설정해주세요.");
    // 개발 편의를 위해 모의(mock) 데이터를 반환합니다.
    return Promise.resolve({
      success: true,
      places: [
        { 
          place_id: "mock_loc_1", 
          name: "지도 기반 모의 식당 1", 
          formatted_address: "서울시 성북구", 
          rating: 4.8, 
          user_ratings_total: 210,
          types: ["restaurant", "food", "point_of_interest"],
          geometry: { location: { lat: location.lat + 0.001, lng: location.lng + 0.001 } },
          photos: [{ photo_reference: "mock_photo_ref_3" }]
        },
        { 
          place_id: "mock_loc_2", 
          name: "지도 기반 모의 식당 2", 
          formatted_address: "서울시 성북구", 
          rating: 4.4, 
          user_ratings_total: 120,
          types: ["cafe", "food", "point_of_interest"],
          geometry: { location: { lat: location.lat - 0.001, lng: location.lng - 0.001 } },
          photos: [{ photo_reference: "mock_photo_ref_4" }]
        },
      ],
      message: "API 키가 없어 모의 데이터를 반환합니다."
    });
  }

  const locationString = `${location.lat},${location.lng}`;
  const url = `/maps/api/place/nearbysearch/json?location=${locationString}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&type=restaurant&key=${API_KEY}&language=ko`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK") {
      return { success: true, places: data.results, message: "주변 장소 검색에 성공했습니다." };
    }
    return { success: false, places: [], message: `API 오류: ${data.status} - ${data.error_message || "알 수 없는 오류"}` };
  } catch (error) {
    console.error("Google Places API 호출 중 네트워크 오류 발생:", error);
    return { success: false, places: [], message: "네트워크 오류로 인해 주변 장소를 검색할 수 없습니다." };
  }
};


/**
 * Google Places API 'Place Details'를 사용하여 특정 장소의 상세 정보를 가져옵니다.
 * @param {string} placeId - 조회할 장소의 place_id
 * @returns {Promise<{success: boolean, details: object|null, message: string}>}
 */
export const getPlaceDetails = async (placeId) => {
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    console.error("Google Places API 키가 설정되지 않았습니다. `.env.local` 파일을 생성하고 `VITE_GOOGLE_PLACES_API_KEY`를 설정해주세요.");
    // 개발 편의를 위해 상세 정보 모의(mock) 데이터를 반환합니다.
    return Promise.resolve({
      success: true,
      details: {
        reviews: [
          { author_name: "모의 사용자 1", rating: 5, text: "정말 최고의 경험이었습니다! (모의 리뷰)", relative_time_description: "2주 전" },
          { author_name: "모의 사용자 2", rating: 4, text: "음식이 맛있고 분위기가 좋네요. (모의 리뷰)", relative_time_description: "1달 전" },
        ],
        opening_hours: {
            weekday_text: [
                "월요일: 오전 9:00 – 오후 10:00",
                "화요일: 오전 9:00 – 오후 10:00",
                "수요일: 오전 9:00 – 오후 10:00",
                "목요일: 오전 9:00 – 오후 10:00",
                "금요일: 오전 9:00 – 오후 11:00",
                "토요일: 오전 10:00 – 오후 11:00",
                "일요일: 오전 10:00 – 오후 9:00"
            ]
        },
        website: "https://example.com",
        formatted_phone_number: "02-1234-5678"
      },
      message: "API 키가 없어 상세 정보 모의 데이터를 반환합니다."
    });
  }
  
  const fields = "name,rating,user_ratings_total,reviews,opening_hours,website,formatted_phone_number";
  const url = `/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}&language=ko`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK") {
      return { success: true, details: data.result, message: "장소 상세 정보 검색에 성공했습니다." };
    }
    return { success: false, details: null, message: `API 오류: ${data.status} - ${data.error_message || "알 수 없는 오류"}` };
  } catch (error) {
    console.error("Google Place Details API 호출 중 네트워크 오류 발생:", error);
    return { success: false, details: null, message: "네트워크 오류로 인해 상세 정보를 검색할 수 없습니다." };
  }
};

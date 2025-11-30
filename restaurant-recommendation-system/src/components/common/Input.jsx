import React from "react";

/**
 * 텍스트 입력 컴포넌트
 * @param {string} label - 라벨 텍스트
 * @param {string} type - 입력 타입 (text, password, email 등)
 * @param {string} value - 입력 값
 * @param {function} onChange - 값 변경 핸들러
 * @param {string} placeholder - 플레이스홀더
 */
export function Input({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder = "",
  required = false,
  className = ""
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
      />
    </div>
  );
}

/**
 * 체크박스 그룹 컴포넌트 (다중 선택)
 * @param {string} label - 그룹 라벨
 * @param {Array} options - 선택 옵션 배열
 * @param {Array} selected - 선택된 값 배열
 * @param {function} onChange - 선택 변경 핸들러
 */
export function CheckboxGroup({ label, options, selected = [], onChange }) {
  // 체크박스 토글 처리
  const handleToggle = (value) => {
    if (selected.includes(value)) {
      // 이미 선택된 경우 제거
      onChange(selected.filter(item => item !== value));
    } else {
      // 선택되지 않은 경우 추가
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {label && <label className="text-sm font-bold text-gray-700">{label}</label>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              className={`
                px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                ${isSelected 
                  ? "bg-indigo-100 border-indigo-500 text-indigo-700" 
                  : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
                }
              `}
            >
              {isSelected && "✓ "}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 범위 선택 컴포넌트 (예산 범위 등)
 * @param {string} label - 라벨
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {Array} value - [최소값, 최대값]
 * @param {function} onChange - 값 변경 핸들러
 */
/*export function RangeInput({ label, min, max, value = [min, max], onChange, step = 1000 }) {
 *  return (
 *    <div className="flex flex-col gap-3">
 *      {label && <label className="text-sm font-bold text-gray-700">{label}</label>}
 *      
 *      <div className="space-y-3">
 *        <div className="flex items-center justify-between text-sm text-gray-600">
 *          <span>{value[0].toLocaleString()}원</span>
 *          <span>~</span>
 *          <span>{value[1].toLocaleString()}원</span>
 *        </div>
 *
 *        <div className="space-y-2">
 *          <input
 *            type="range"
 *            min={min}
 *            max={max}
 *            step={step}
 *            value={value[0]}
 *            onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
 *            className="w-full"
 *          />
 *          <input
 *            type="range"
 *            min={min}
 *            max={max}
 *            step={step}
 *            value={value[1]}
 *            onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
 *            className="w-full"
 *          />
 *        </div>
 *      </div>
 *    </div>
 *  );
 *}
 */

/**
 * 개선된 범위 선택 컴포넌트 (추천)
 * - Range Slider 스타일로 시각화
 * - 선택된 범위가 하이라이트됨
 */
export function RangeInput({ label, min = 0, max = 100000, value = [0, 50000], onChange, step = 1000 }) {
  // 퍼센트 계산
  const minPercent = ((value[0] - min) / (max - min)) * 100;
  const maxPercent = ((value[1] - min) / (max - min)) * 100;

  const handleMinChange = (e) => {
    const newMin = parseInt(e.target.value);
    if (newMin <= value[1]) {
      onChange([newMin, value[1]]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = parseInt(e.target.value);
    if (newMax >= value[0]) {
      onChange([value[0], newMax]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {label && <label className="text-sm font-bold text-gray-700">{label}</label>}
      
      <div className="space-y-4">
        {/* 가격 표시 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center px-4 py-2 bg-indigo-100 rounded-lg">
            <span className="text-xs text-indigo-600 font-medium">최소</span>
            <span className="text-lg font-bold text-indigo-700">
              {value[0].toLocaleString()}원
            </span>
          </div>
          <span className="text-gray-400 font-bold">~</span>
          <div className="flex flex-col items-center px-4 py-2 bg-indigo-100 rounded-lg">
            <span className="text-xs text-indigo-600 font-medium">최대</span>
            <span className="text-lg font-bold text-indigo-700">
              {value[1].toLocaleString()}원
            </span>
          </div>
        </div>

        {/* Range Slider 영역 */}
        <div className="relative pt-2 pb-8">
          {/* 배경 트랙 */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full -translate-y-1/2" />
          
          {/* 선택된 범위 하이라이트 */}
          <div 
            className="absolute top-1/2 h-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full -translate-y-1/2 transition-all"
            style={{
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`,
            }}
          />

          {/* 최소값 슬라이더 */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={handleMinChange}
            className="absolute top-1/2 left-0 right-0 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md hover:[&::-moz-range-thumb]:scale-110 [&::-moz-range-thumb]:transition-transform"
            style={{ zIndex: value[0] > max - (max - min) / 10 ? 5 : 3 }}
          />

          {/* 최대값 슬라이더 */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[1]}
            onChange={handleMaxChange}
            className="absolute top-1/2 left-0 right-0 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md hover:[&::-moz-range-thumb]:scale-110 [&::-moz-range-thumb]:transition-transform"
            style={{ zIndex: 4 }}
          />

          {/* 눈금 표시 - 아래로 더 이동 */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
            <span className="inline-block text-left" style={{ width: '33.33%' }}>
              {min.toLocaleString()}원
            </span>
            <span className="inline-block text-center" style={{ width: '33.33%' }}>
              {((min + max) / 2).toLocaleString()}원
            </span>
            <span className="inline-block text-right" style={{ width: '33.33%' }}>
              {max.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 범위 설명 */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-indigo-600">
              {value[0].toLocaleString()}원
            </span>
            {' '} ~ {' '}
            <span className="font-semibold text-indigo-600">
              {value[1].toLocaleString()}원
            </span>
            {' '}범위의 식당을 추천합니다
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

const POPUP_STORAGE_KEY = "sewon_main_popup_hidden_until";

export default function MainPopupPage() {
  const handleClose = () => {
    window.close();
  };

  const handleHideToday = () => {
    const oneDayLater = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(POPUP_STORAGE_KEY, String(oneDayLater));
    window.close();
  };

  return (
    <div className="w-screen h-screen bg-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <img
          src="/banner/main-banner.png"
          alt="메인 배너"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/no-image.png";
          }}
        />
      </div>

      <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between text-sm bg-white">
        <button
          type="button"
          onClick={handleHideToday}
          className="text-gray-500 hover:text-black"
        >
          오늘 하루 보지 않기
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="text-gray-500 hover:text-black"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
type DeliveryStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_COMPLETE"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

type Props = {
  status: DeliveryStatus | string;
};

const steps = [
  { key: "PAYMENT_COMPLETE", label: "배송출고" },
  { key: "SHIPPING", label: "배송중" },
  { key: "DELIVERED", label: "배송완료" },
];

export default function DeliveryProgress({ status }: Props) {
  const getStepIndex = () => {
    if (status === "PAYMENT_COMPLETE") return 0;
    if (status === "SHIPPING") return 1;
    if (status === "DELIVERED") return 2;
    return -1;
  };

  const currentStep = getStepIndex();
  const isCancelled =
    status === "CANCELLED" || status === "RETURNED" || status === "REFUNDED";

  if (isCancelled) {
    return (
      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-600">주문이 취소 또는 종료된 상태입니다.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        <div
          className="absolute top-4 left-0 h-1 bg-black rounded-full transition-all duration-500"
          style={{
            width:
              currentStep < 0
                ? "0%"
                : currentStep === 0
                ? "0%"
                : currentStep === 1
                ? "50%"
                : "100%",
          }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const active = currentStep >= index;
            const done = currentStep > index;

            return (
              <div key={step.key} className="flex flex-col items-center w-1/3">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 bg-white ${
                    active
                      ? "border-black text-black"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    active ? "text-black" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
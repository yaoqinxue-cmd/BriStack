export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full mx-4">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">已成功退订</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          你已从此 Space 退订。我们会尊重你的选择，不再向你发送邮件。
        </p>
        <p className="text-gray-400 text-xs mt-4">
          如果你是不小心点到了，可以回到订阅页面重新订阅。
        </p>
      </div>
    </div>
  );
}

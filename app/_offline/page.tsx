export default function OfflinePage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold mb-2">أنت غير متصل</h1>
        <p className="text-muted-foreground mb-4">
          لا يوجد اتصال بالإنترنت حالياً. يمكنك متابعة التصفح للصفحات المخزنة وسيتم تحديث المحتوى عند عودة الاتصال.
        </p>
        <button
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          إعادة المحاولة
        </button>
      </div>
    </main>
  )
}



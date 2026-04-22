export default function GdprPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Data processing notice</h1>
      <p className="text-sm text-fg-muted">
        When you register for a stay at this property, we collect your name, date of birth (via
        document type / number), and a photo of your identity document to comply with local
        short-term-rental guest-reporting laws. Your data is kept for the legally required period
        and then deleted.
      </p>
      <p className="text-sm text-fg-muted">
        If you want to see, correct, or delete your data, contact your host directly — they own
        this data and act as the controller.
      </p>
    </main>
  );
}

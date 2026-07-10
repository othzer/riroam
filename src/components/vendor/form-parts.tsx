// Small presentational form helpers shared by the listing forms.
export function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="mb-4 font-heading text-lg font-bold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-danger">{msg}</p> : null;
}

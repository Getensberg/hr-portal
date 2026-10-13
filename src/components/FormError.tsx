// Красная строка с ошибкой под формой; ничего не рисует, если ошибки нет
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs" style={{ color: "var(--color-danger)", margin: 0 }}>
      {message}
    </p>
  );
}

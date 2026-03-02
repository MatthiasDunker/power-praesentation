export default function Paragraph({
  className,
  node,
  ...props
}: {
  className?: string;
  node?: any;
}) {
  return (
    <p
      className={["typo-body tint-c-text max-w-200", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

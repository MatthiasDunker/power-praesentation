export default function Headline({
  className,
  node,
  ...props
}: {
  className?: string;
  node?: any;
}) {
  return (
    <p
      className={["typo-headline tint-c-text max-w-200", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

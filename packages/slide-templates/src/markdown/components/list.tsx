export default function List({
  className,
  node,
  ...props
}: {
  className?: string;
  node?: any;
}) {
  return (
    <ul
      className={["typo-body tint-c-text max-w-200", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

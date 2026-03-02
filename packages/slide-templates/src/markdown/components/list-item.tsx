export default function ListItem({
  className,
  node,
  ...props
}: {
  className?: string;
  node?: any;
}) {
  return (
    <li
      style={{ listStyleType: '"\u2014\u0020"' }}
      className={["ml-[1.5em]", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

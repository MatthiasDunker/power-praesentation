export interface FooterPartialProps {
  text: string;
  className?: string;
}

export function FooterPartial({ text, className }: FooterPartialProps) {
  return (
    <p
      className={[
        "text-sm leading-tight text-zinc-500 whitespace-pre-wrap",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-power-partial="footer"
    >
      {text}
    </p>
  );
}

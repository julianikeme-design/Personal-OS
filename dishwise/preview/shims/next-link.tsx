import { forwardRef, type AnchorHTMLAttributes } from "react";
import { useRouteState } from "../router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | { pathname: string }; prefetch?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, onClick, prefetch: _prefetch, ...rest }, ref) {
  const { push } = useRouteState();
  const to = typeof href === "string" ? href : href.pathname;
  return (
    <a
      ref={ref}
      href="#"
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        push(to);
      }}
    />
  );
});
export default Link;

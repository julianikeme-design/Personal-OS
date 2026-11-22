// Maps the automatic JSX runtime onto React 18's UMD global.
import React from "react";
type Props = Record<string, unknown> | null;
export const Fragment = React.Fragment;
export function jsx(type: React.ElementType, props: Props, key?: React.Key) {
  return React.createElement(type, key === undefined ? props : { ...props, key });
}
export const jsxs = jsx;

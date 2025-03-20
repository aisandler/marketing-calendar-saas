declare module 'tippy.js' {
  export default function tippy(targets: Element | Element[] | NodeList | null, options?: any): any;
  export function delegate(target: Element | string, options?: any): any;
  export function hideAll(options?: any): void;
  export function setDefaultProps(props: any): void;
} 
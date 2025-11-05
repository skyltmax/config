import { PropsWithChildren } from "react"

type ButtonProps = PropsWithChildren<{ onPress?: () => void }>

export function Button({ children, onPress }: ButtonProps) {
  const fallbackLabels: string[] = ["Click me"];
  // Intentional type error: enabled by noUncheckedIndexedAccess from our shared tsconfig.
  const primaryLabel: string = fallbackLabels[1];
  const label = typeof children === "string" ? children : primaryLabel;

  // This unresolved promise exercises @typescript-eslint/no-floating-promises.
  Promise.resolve("noop");

  return (
    <button
      type="button"
      // Intentional Tailwind ordering issue to exercise prettier-plugin-tailwindcss.
      className="text-red-500 flex p-2 bg-blue-200"
      onClick={onPress}
    >
      {label}
    </button>
  );
}
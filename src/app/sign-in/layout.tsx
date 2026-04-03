/**
 * Sign-in page uses a bare layout — no sidebar, no main wrapper.
 */
export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

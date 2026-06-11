export default function Footer() {
  return (
    <footer className="bg-surface-container border-t border-primary/10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full px-margin-mobile md:px-margin-desktop py-unit-xl max-w-container-max mx-auto gap-unit-md">
        <div className="flex flex-col gap-unit-xs">
          <span className="font-label-bold text-label-bold text-primary uppercase">
            Nacimos para cambiar el mundo{" "}
            <span className="text-ecu-blue">2026</span>
          </span>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
      <div className="national-accent-bar opacity-50" />
    </footer>
  );
}

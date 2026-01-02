export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      <div className="container py-8 relative z-10">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Election Commission of India - Simulated Election Platform
          </p>
        </div>
      </div>
    </footer>
  );
}

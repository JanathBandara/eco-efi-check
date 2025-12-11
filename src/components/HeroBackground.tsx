export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Base gradient */}
      <div className="absolute inset-0 gradient-eco-light opacity-50" />
      
      {/* Animated blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-eco-green-light rounded-full blur-3xl opacity-60 animate-float" />
      <div 
        className="absolute bottom-20 -right-32 w-80 h-80 bg-eco-blue-light rounded-full blur-3xl opacity-50 animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-eco-green-light/30 to-transparent rounded-full blur-2xl"
      />
      
      {/* Decorative leaves/circles */}
      <svg 
        className="absolute top-10 right-10 w-24 h-24 text-eco-green/20 animate-pulse-eco"
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="45" fill="currentColor" />
      </svg>
      <svg 
        className="absolute bottom-20 left-20 w-16 h-16 text-eco-blue/20 animate-pulse-eco"
        style={{ animationDelay: "1s" }}
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="45" fill="currentColor" />
      </svg>
    </div>
  );
};

import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";

const useMouseGradient = (ref) => {
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ref.current.style.setProperty("--mouse-x", `${x}px`);
      ref.current.style.setProperty("--mouse-y", `${y}px`);
    };
    const element = ref.current;
    element.addEventListener("mousemove", handleMouseMove);
    return () => element.removeEventListener("mousemove", handleMouseMove);
  }, [ref]);
};

const useStarfield = (canvasRef) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const stars = [];
    const shootingStars = [];
    const starCount = 200;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 0.8 + 0.2,
        opacity: Math.random() * 0.6 + 0.4,
        blinkSpeed: Math.random() * 0.02 + 0.01
      });
    }

    class ShootingStar {
      constructor() {
        this.reset();
      }

      reset() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        this.x = canvas.width + 200;
        this.y = -200;
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const angle = Math.atan2(dy, dx);
        this.length = 300;
        this.speed = 6;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.alpha = 1;
        this.angle = angle;
        this.active = true;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.002;
        if (this.alpha <= 0 || this.y > canvas.height + 100) {
          this.active = false;
        }
      }

      draw() {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(
          this.x,
          this.y,
          this.x - this.length * Math.cos(this.angle),
          this.y - this.length * Math.sin(this.angle)
        );
        grad.addColorStop(0, `rgba(255,255,255,${this.alpha})`);
        grad.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x - this.length * Math.cos(this.angle),
          this.y - this.length * Math.sin(this.angle)
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "white";
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const launchStars = () => {
      const batch = Math.random() < 0.4 ? Math.floor(Math.random() * 3) + 2 : 1;
      for (let i = 0; i < batch; i++) {
        shootingStars.push(new ShootingStar());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.opacity += star.blinkSpeed;
        if (star.opacity > 1 || star.opacity < 0.4) {
          star.blinkSpeed *= -1;
        }
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      });

      shootingStars.forEach((star, i) => {
        star.update();
        if (!star.active) shootingStars.splice(i, 1);
        else star.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();
    launchStars();
    const interval = setInterval(launchStars, 20000);

    window.addEventListener("resize", () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    });

    return () => clearInterval(interval);
  }, []);
};

const NoChatSelected = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useMouseGradient(containerRef);
  useStarfield(canvasRef);
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const navigate = useNavigate();

  const handleAuraClick = () => {
    setSelectedUser({ _id: "aura", fullName: "Aura" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-1 flex-col items-center justify-center p-8 sm:p-16 bg-gradient-to-br from-base-100/90 to-base-200/80 backdrop-blur-md overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="relative z-10 max-w-lg text-center space-y-8">
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-glow shadow-lg border border-primary/20 overflow-hidden">
              <MessageSquare className="w-10 h-10 text-primary" />
              <div className="shine absolute inset-0"></div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary animate-gradient-text">
            Welcome to <span className="tracking-wide">NexVerse</span>
          </h2>

          <div className="text-base-content/70 space-y-2">
            <p className="text-lg font-semibold">
              Select a conversation from the sidebar to dive into the future of secure communication.
            </p>
            <p className="text-sm sm:text-base opacity-80">• One of the best end-to-end encrypted chatting apps.</p>
            <p className="text-sm sm:text-base opacity-80">• Zero logs. Complete privacy. Built for real conversations.</p>
          </div>
        </div>

        <button
          className="mt-4 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          onClick={handleAuraClick}
        >
          What's New
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-base-100/95 p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                What's New in NexVerse
              </h3>
              <button
                onClick={closeModal}
                className="text-base-content/50 hover:text-base-content transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-base-content/80 space-y-4">
              <p className="text-lg font-semibold">Version 3.0 Update</p>
                <ul className="list-disc list-inside space-y-2">
                   <li>Enhanced end-to-end encryption using quantum-resistant algorithms.</li>
                   <li>Introduced a new starfield animation for a cosmic chat experience.</li>
                   <li>Optimized performance with 50% faster message synchronization.</li>
                   <p className="text-lg font-semibold">Technical Updates</p>
                   <li>Implemented advanced and user-friendly error handling mechanisms.</li>
                  <li>Integrated seamless video and camera functionality.</li>
               </ul>
              <p className="text-sm italic font-bold">Stay tuned for more updates as we continue to explore the NexVerse!</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%);
          animation: shine 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.2), 0 0 20px rgba(255, 255, 255, 0.1); }
          50% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes gradient-text {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-text 5s linear infinite;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .relative {
          --mouse-x: 50%;
          --mouse-y: 50%;
          background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 30%);
        }
      `}</style>
    </div>
  );
};

export default NoChatSelected;
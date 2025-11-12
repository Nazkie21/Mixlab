const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CEO, TechStart",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content: "This product has completely transformed how we operate. The team is responsive, and the results speak for themselves. Highly recommend!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Founder, DesignHub",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content: "Outstanding service and attention to detail. They understood our vision perfectly and delivered beyond our expectations.",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Director, GrowthCo",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    content: "We saw a 300% increase in engagement within the first month. The ROI has been incredible and continues to exceed our goals.",
    rating: 5
  },
  {
    name: "David Thompson",
    role: "Product Manager, InnovateLabs",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    content: "Professional, reliable, and innovative. Working with this team has been one of the best decisions we've made this year.",
    rating: 5
  }
];

let current = 0;
let isAnimating = false;

const content = document.getElementById("testimonial-content");
const image = document.getElementById("testimonial-image");
const nameEl = document.getElementById("testimonial-name");
const roleEl = document.getElementById("testimonial-role");
const starsEl = document.getElementById("stars");
const dotsEl = document.getElementById("dots");

function renderTestimonial(index) {
  const t = testimonials[index];
  content.style.opacity = 0;
  setTimeout(() => {
    content.textContent = `"${t.content}"`;
    image.src = t.image;
    nameEl.textContent = t.name;
    roleEl.textContent = t.role;
    starsEl.innerHTML = "★".repeat(t.rating)
      .split("")
      .map(star => `<span class="star">${star}</span>`)
      .join("");
    document.querySelectorAll(".dot").forEach((dot, i) =>
      dot.classList.toggle("active", i === index)
    );
    content.style.opacity = 1;
  }, 200);
}

function nextTestimonial() {
  if (isAnimating) return;
  isAnimating = true;
  current = (current + 1) % testimonials.length;
  renderTestimonial(current);
  setTimeout(() => (isAnimating = false), 500);
}

function prevTestimonial() {
  if (isAnimating) return;
  isAnimating = true;
  current = (current - 1 + testimonials.length) % testimonials.length;
  renderTestimonial(current);
  setTimeout(() => (isAnimating = false), 500);
}

// Setup dots
testimonials.forEach((_, i) => {
  const dot = document.createElement("div");
  dot.className = "dot";
  dot.addEventListener("click", () => {
    if (!isAnimating) {
      current = i;
      renderTestimonial(current);
    }
  });
  dotsEl.appendChild(dot);
});

document.getElementById("nextBtn").addEventListener("click", nextTestimonial);
document.getElementById("prevBtn").addEventListener("click", prevTestimonial);

// Auto-rotate
setInterval(nextTestimonial, 6000);

// Initialize
renderTestimonial(current);




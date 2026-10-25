/* ====================================
   PiVisen AI
   Main JavaScript
==================================== */


document.addEventListener("DOMContentLoaded", () => {


    /* ====================================
       Smooth Navigation
    ==================================== */

    const navLinks = document.querySelectorAll(
        ".nav-links a"
    );


    navLinks.forEach(link => {


        link.addEventListener(
            "click",
            function(event){


                const targetId =
                this.getAttribute("href");


                const targetSection =
                document.querySelector(targetId);



                if(targetSection){


                    event.preventDefault();


                    targetSection.scrollIntoView({

                        behavior:"smooth"

                    });


                }


            }
        );


    });

    /* ====================================
       Dynamic Footer Year
    ==================================== */

    const footerText =
    document.querySelector(
        ".footer p"
    );



    if(footerText){


        const year =
        new Date().getFullYear();



        footerText.textContent =
        `© ${year} PiVisen. All Rights Reserved.`;


    }

// ==========================================
// MOBILE NAVIGATION
// ==========================================

const menuToggle = document.querySelector(".menu-toggle");
const navLinksMenu = document.querySelector(".nav-links");

if (menuToggle && navLinksMenu) {

    menuToggle.addEventListener("click", () => {

        navLinksMenu.classList.toggle("active");

        const expanded =
            menuToggle.getAttribute("aria-expanded") === "true";

        menuToggle.setAttribute(
            "aria-expanded",
            !expanded
        );

    });

}

// ==========================================
// SCROLL REVEAL ANIMATION
// ==========================================

const revealElements = document.querySelectorAll(".reveal");


function revealOnScroll(){


    revealElements.forEach(element => {


        const windowHeight = window.innerHeight;


        const elementTop = element.getBoundingClientRect().top;


        const revealPoint = 120;



        if(elementTop < windowHeight - revealPoint){

            element.classList.add("active");

        }


    });


}



window.addEventListener(
    "scroll",
    revealOnScroll
);



revealOnScroll();



// ==========================================
// SCROLL TO TOP BUTTON
// ==========================================

  const scrollTopBtns = document.querySelectorAll('.scroll-top, .scroll-top-btn');
  if (scrollTopBtns.length === 0) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const radius = 23;
  const circumference = 2 * Math.PI * radius;

  // Initialize each button instance
  scrollTopBtns.forEach(btn => {
    if (!btn.querySelector('.scroll-progress-ring')) {
      const svg = document.createElementNS(svgNS, "svg");
      svg.className.baseVal = "scroll-progress-ring";
      svg.setAttribute("width", "100");
      svg.setAttribute("height", "100");
      svg.setAttribute("viewBox", "0 0 50 50");

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", "25");
      circle.setAttribute("cy", "25");
      circle.setAttribute("r", radius);

      svg.appendChild(circle);
      btn.insertBefore(svg, btn.firstChild);
    }

    const progressCircle = btn.querySelector('.scroll-progress-ring circle');
    if (progressCircle) {
      progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      progressCircle.style.strokeDashoffset = circumference;
    }

    // Click handler for smooth scrolling to top
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Single global scroll listener for maximum performance across all pages
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    const strokeDashoffsetValue = circumference - (scrollPercent / 100) * circumference;

    scrollTopBtns.forEach(btn => {
      const progressCircle = btn.querySelector('.scroll-progress-ring circle');
      if (progressCircle) {
        progressCircle.style.strokeDashoffset = strokeDashoffsetValue;
      }

      if (scrollTop > 300) {
        btn.classList.add('show');
      } else {
        btn.classList.remove('show');
      }
    });
  }, { passive: true });

// ==========================================
// EMAILJS CONTACT FORM
// ==========================================

(function(){

    emailjs.init({
        publicKey: "jKQm7Yy0mXBAAy3sG",
    });

})();



const contactForm = document.getElementById("contact-form");


if(contactForm){

    contactForm.addEventListener("submit", function(event){

        event.preventDefault();


        emailjs.sendForm(

            "service_ll6ox79",

            "template_bc0wtu9",

            this

        )

        .then(() => {


            alert(
            "Message sent successfully! PiVisen AI team will contact you soon."
            );


            contactForm.reset();


        })


        .catch((error)=>{


            console.error(
                "EmailJS Error:",
                error
            );


            alert(
            "Message sending failed. Please try again."
            );


        });


    });

}

// ==========================================
// HOME PAGE-HERO SECTION TYPEWRITER EFFECT
// ==========================================

  // Home Page Typewriter Effect
  const typedTextSpan = document.getElementById("home-typewriter-text");
  const textArray = [
    "Computer Vision",
    "Edge Intelligence",
    "Cloud Systems",
    "Intelligence Surveillance",
  ];
  const typingDelay = 100;
  const erasingDelay = 50;
  const newTextDelay = 2000;
  let textArrayIndex = 0;
  let charIndex = 0;

  function typeText() {
    if (charIndex < textArray[textArrayIndex].length) {
      typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
      charIndex++;
      setTimeout(typeText, typingDelay);
    } else {
      setTimeout(eraseText, newTextDelay);
    }
  }

  function eraseText() {
    if (charIndex > 0) {
      typedTextSpan.textContent = textArray[textArrayIndex].substring(
        0,
        charIndex - 1,
      );
      charIndex--;
      setTimeout(eraseText, erasingDelay);
    } else {
      textArrayIndex++;
      if (textArrayIndex >= textArray.length) textArrayIndex = 0;
      setTimeout(typeText, typingDelay + 500);
    }
  }

  if (textArray.length) {
    setTimeout(typeText, newTextDelay + 250);
  }

// ==========================================
// ABOUT PAGE-HERO SECTION TYPEWRITER EFFECT
// ==========================================

  // 2. Reusable Typewriter Utility
  function setupTypewriter(elementId, textArray, delays, initialDelay) {
    const span = document.getElementById(elementId);
    if (!span || !textArray.length) return;

    let arrayIndex = 0;
    let charIndex = 0;

    function type() {
      if (charIndex < textArray[arrayIndex].length) {
        span.textContent += textArray[arrayIndex].charAt(charIndex);
        charIndex++;
        setTimeout(type, delays.typing);
      } else {
        setTimeout(erase, delays.newText);
      }
    }

    function erase() {
      if (charIndex > 0) {
        span.textContent = textArray[arrayIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(erase, delays.erasing);
      } else {
        arrayIndex++;
        if (arrayIndex >= textArray.length) arrayIndex = 0;
        setTimeout(type, delays.typing + delays.pauseOffset);
      }
    }

    setTimeout(type, initialDelay);
  }

  // Hero Section Typewriter
  setupTypewriter(
    "about-typewriter-text",
    [
      "Cloud AI & Edge Vision",
      "Computer Vision & ML",
      "Neural AI & DL",
      "AI Surveillance",
    ],
    { typing: 100, erasing: 50, newText: 2000, pauseOffset: 500 },
    2250
  );

  // Mission Section Typewriter
  setupTypewriter(
    "mission-typewriter-text",
    [
      "Real-Time Neural Processing",
      "Smart Industrial Autonomy",
      "Advanced Edge Intelligence",
    ],
    { typing: 90, erasing: 45, newText: 2200, pauseOffset: 400 },
    1000
  );

  // 3. Trust Carousel
  const track = document.querySelector(".trust-carousel-track");
  const nextBtn = document.querySelector(".next-btn");
  const prevBtn = document.querySelector(".prev-btn");

  if (track && nextBtn && prevBtn) {
    const cards = Array.from(track.children);
    let currentIndex = 0;

    function updateCarousel(index) {
      const cardWidth = cards[0].getBoundingClientRect().width;
      track.scrollTo({
        left: cardWidth * index,
        behavior: "smooth",
      });
    }

    nextBtn.addEventListener("click", () => {
      if (currentIndex < cards.length - 1) {
        currentIndex++;
        updateCarousel(currentIndex);
      }
    });

    prevBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel(currentIndex);
      }
    });
  }

// ==========================================
// SERVICES PAGE JAVASCRIPT
// ==========================================

  /* Hero Typewriter */
  function runTypewriter(element, text, speed, callback) {
    let index = 0;
    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      } else if (callback) {
        callback();
      }
    }
    type();
  }

  const headingElement = document.getElementById("typewriter-heading");
  const headingText = "Advanced Cloud AI, Edge Vision & Intelligence Solutions";
  if (headingElement) {
    runTypewriter(headingElement, headingText, 40);
  }

  document.querySelectorAll(".typewriter-sub").forEach((el, index) => {
    const text = el.getAttribute("data-text");
    setTimeout(() => {
      runTypewriter(el, text, 50);
    }, index * 600);
  });


  /* Sequential Chain Animation */
  const chainObserver = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const row = entry.target;
          startChainTypingSequence(row);
          observerInstance.unobserve(row);
        }
      });
    },
    { root: null, rootMargin: "0px", threshold: 0.25 }
  );

  document.querySelectorAll("[data-chain-row]").forEach((row) => {
    chainObserver.observe(row);
  });

  function startChainTypingSequence(row) {
    const iconBox = row.querySelector(".square-icon-box");
    const headingEl = row.querySelector(".typed-heading");
    const descEl = row.querySelector(".typed-desc");
    const listEl = row.querySelector(".typed-list");

    const headingText = headingEl.getAttribute("data-text");
    const descText = descEl.getAttribute("data-text");
    const itemsArr = JSON.parse(listEl.getAttribute("data-items"));

    if (iconBox) {
      iconBox.classList.add("active-badge");
    }

    setTimeout(() => {
      runTypewriter(headingEl, headingText, 30, () => {
        runTypewriter(descEl, descText, 20, () => {
          typeChainListItems(itemsArr, 0, listEl);
        });
      });
    }, 300);
  }

  function typeChainListItems(arr, itemIdx, listElement) {
    if (itemIdx < arr.length) {
      const li = document.createElement("li");
      listElement.appendChild(li);
      runTypewriter(li, arr[itemIdx], 25, () => {
        typeChainListItems(arr, itemIdx + 1, listElement);
      });
    }
  }

// ==========================================
// UNIVERSAL BUTTONS HOVER EFFECTS MANAGER
// ==========================================

// Helper function for button hover shadows & transforms
const applyButtonHoverEffect = (selector, mouseOverStyles, mouseOutStyles) => {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach(btn => {
    btn.addEventListener('mouseover', () => {
      Object.assign(btn.style, mouseOverStyles);
    });
    btn.addEventListener('mouseout', () => {
      Object.assign(btn.style, mouseOutStyles);
    });
  });
};

// 1. General Consultation Buttons
applyButtonHoverEffect(
  '.consultation-btn',
  { boxShadow: '0 8px 20px rgba(0, 210, 132, 0.3)' },
  { boxShadow: 'none' }
);

// 2. Expert AI Consultation Buttons
document.querySelectorAll('a.btn[href="contact.html"]').forEach(btn => {
  if (btn.textContent.includes('Request Expert AI Consultation')) {
    btn.addEventListener('mouseover', function() {
      Object.assign(this.style, {
        boxShadow: '0 6px 20px rgba(0, 210, 132, 0.4)',
        transform: 'translateY(-1px)'
      });
    });
    btn.addEventListener('mouseout', function() {
      Object.assign(this.style, {
        boxShadow: '0 4px 15px rgba(0, 210, 132, 0.25)',
        transform: 'translateY(0)'
      });
    });
  }
});


});
